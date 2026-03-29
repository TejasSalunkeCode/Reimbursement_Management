'use strict';

const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { Approval, Expense, User, ApprovalRule } = require('../models');
const RuleEngine = require('./ruleEngine.service');

// ── helpers ───────────────────────────────────────────────────────────────────

const httpError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

/** Eager-load config reused across queries */
const approvalIncludes = [
  {
    model: Expense,
    as: 'expense',
    attributes: ['id', 'amount', 'currency', 'convertedAmount', 'category', 'description', 'date', 'status'],
    include: [
      { model: User, as: 'submittedBy', attributes: ['id', 'name', 'email', 'role'] },
    ],
  },
  {
    model: User,
    as: 'approver',
    attributes: ['id', 'name', 'email', 'role'],
  },
];

// ── private helpers ───────────────────────────────────────────────────────────

/**
 * Check that all previous steps for an expense are Approved.
 * Throws 409 if any predecessor is not yet Approved.
 */
const enforceStepOrder = async (approval, t) => {
  const blockersCount = await Approval.count({
    where: {
      expenseId: approval.expenseId,
      stepNumber: { [Op.lt]: approval.stepNumber },
      status: { [Op.ne]: 'Approved' },
    },
    transaction: t,
  });

  if (blockersCount > 0) {
    throw httpError('Cannot act: a previous step has not been approved yet.', 409);
  }
};

/**
 * Auto-approve all remaining Pending steps and mark the expense Approved.
 * Called when a rule engine condition is met or the last step is completed.
 */
const autoApproveRemaining = async (expenseId, currentStepNumber, reason, t) => {
  await Approval.update(
    {
      status: 'Approved',
      comments: `Auto-approved by rule engine: ${reason}`,
    },
    {
      where: {
        expenseId,
        stepNumber: { [Op.gt]: currentStepNumber },
        status: 'Pending',
      },
      transaction: t,
    }
  );

  await Expense.update(
    { status: 'Approved' },
    { where: { id: expenseId }, transaction: t }
  );
};

// ── service methods ───────────────────────────────────────────────────────────

/**
 * GET /approvals/pending
 * Returns all ACTIVE Pending approval steps assigned to the current user.
 * A step is "active" only if all preceding steps are already Approved.
 */
const getMyPendingApprovals = async (currentUser) => {
  const allPending = await Approval.findAll({
    where: { approverId: currentUser.id, status: 'Pending' },
    include: approvalIncludes,
    order: [['stepNumber', 'ASC']],
  });

  // Filter to only truly active steps (no unresolved predecessors)
  const activeApprovals = [];
  for (const approval of allPending) {
    const blockersCount = await Approval.count({
      where: {
        expenseId: approval.expenseId,
        stepNumber: { [Op.lt]: approval.stepNumber },
        status: { [Op.ne]: 'Approved' },
      },
    });
    if (blockersCount === 0) activeApprovals.push(approval);
  }

  return activeApprovals;
};

/**
 * POST /approvals/:id/approve
 *
 * Flow:
 *  1. Mark current step as Approved (inside transaction + row lock)
 *  2. Fetch all sibling steps (same expenseId) with updated state
 *  3. Run RuleEngine.evaluate() against company rules
 *  4a. Rule triggered → auto-approve remaining steps + mark expense Approved
 *  4b. No rule triggered + no next step → mark expense Approved (last step)
 *  4c. No rule triggered + next step exists → wait (next step becomes active)
 */
const approveStep = async (currentUser, approvalId, { comments } = {}) => {
  const t = await sequelize.transaction();

  try {
    // 1. Fetch & validate the approval step
    const approval = await Approval.findOne({
      where: { id: approvalId, approverId: currentUser.id },
      include: [{ model: Expense, as: 'expense' }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!approval) throw httpError('Approval step not found or not assigned to you.', 404);
    if (approval.status !== 'Pending') {
      throw httpError(`This step is already ${approval.status}.`, 409);
    }

    // 2. Enforce sequential order
    await enforceStepOrder(approval, t);

    // 3. Mark current step as Approved
    await approval.update(
      { status: 'Approved', comments: comments || null },
      { transaction: t }
    );

    // 4. Re-fetch ALL approval steps for this expense (with updated statuses)
    const allApprovals = await Approval.findAll({
      where: { expenseId: approval.expenseId },
      order: [['stepNumber', 'ASC']],
      transaction: t,
    });

    // 5. Fetch company ApprovalRules for the rule engine
    const rules = await ApprovalRule.findAll({
      where: { companyId: currentUser.companyId },
      order: [['id', 'ASC']],
      transaction: t,
    });

    // 6. Run Rule Engine
    const ruleResult = RuleEngine.evaluate({
      expense: approval.expense,
      currentApproval: approval,
      allApprovals,
      rules,
    });

    // Attach audit trace to the approval comment for transparency
    const auditTrace = RuleEngine.audit({
      expense: approval.expense,
      currentApproval: approval,
      allApprovals,
      rules,
    });
    console.log('[RuleEngine Audit]', JSON.stringify(auditTrace, null, 2));

    if (ruleResult.triggered) {
      // Rule engine override → auto-approve remaining steps + expense
      await autoApproveRemaining(
        approval.expenseId,
        approval.stepNumber,
        ruleResult.reason,
        t
      );
      await t.commit();
      return {
        message: `Step approved. Rule engine triggered auto-approval: ${ruleResult.reason}`,
        ruleTriggered: true,
        rule: ruleResult.rule,
        approval,
      };
    }

    // No rule triggered — check if this was the last step
    const pendingRemaining = allApprovals.filter((a) => a.status === 'Pending').length;
    if (pendingRemaining === 0) {
      // All steps done → mark expense Approved
      await Expense.update(
        { status: 'Approved' },
        { where: { id: approval.expenseId }, transaction: t }
      );
    }

    await t.commit();
    return {
      message: pendingRemaining === 0
        ? 'Step approved. All steps complete — expense approved.'
        : `Step approved. Awaiting ${pendingRemaining} more step(s).`,
      ruleTriggered: false,
      approval,
    };

  } catch (err) {
    await t.rollback();
    throw err;
  }
};

/**
 * POST /approvals/:id/reject
 * Rejects a step; cancels remaining steps; marks expense Rejected.
 * Rule engine is NOT evaluated on rejection (rejection is always terminal).
 */
const rejectStep = async (currentUser, approvalId, { comments } = {}) => {
  const t = await sequelize.transaction();

  try {
    const approval = await Approval.findOne({
      where: { id: approvalId, approverId: currentUser.id },
      include: [{ model: Expense, as: 'expense' }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!approval) throw httpError('Approval step not found or not assigned to you.', 404);
    if (approval.status !== 'Pending') {
      throw httpError(`This step is already ${approval.status}.`, 409);
    }

    await enforceStepOrder(approval, t);

    // Reject the current step
    await approval.update(
      { status: 'Rejected', comments: comments || null },
      { transaction: t }
    );

    // Cancel all downstream Pending steps
    await Approval.update(
      { status: 'Rejected', comments: 'Cancelled due to rejection of a previous step.' },
      {
        where: {
          expenseId: approval.expenseId,
          stepNumber: { [Op.gt]: approval.stepNumber },
          status: 'Pending',
        },
        transaction: t,
      }
    );

    // Mark expense as Rejected
    await Expense.update(
      { status: 'Rejected' },
      { where: { id: approval.expenseId }, transaction: t }
    );

    await t.commit();
    return { message: 'Step rejected. Expense has been rejected.', approval };

  } catch (err) {
    await t.rollback();
    throw err;
  }
};

module.exports = { getMyPendingApprovals, approveStep, rejectStep };
