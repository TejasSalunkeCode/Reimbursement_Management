'use strict';

const { sequelize } = require('../config/database');
const { Approval, Expense, User } = require('../models');

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

// ── service methods ───────────────────────────────────────────────────────────

/**
 * GET /approvals/pending
 * Returns all Pending approval steps assigned to the current user where
 * the step is "active" — i.e. all previous steps for that expense are Approved.
 */
const getMyPendingApprovals = async (currentUser) => {
  // Fetch all Pending approvals for this approver
  const allPending = await Approval.findAll({
    where: { approverId: currentUser.id, status: 'Pending' },
    include: approvalIncludes,
    order: [['stepNumber', 'ASC']],
  });

  // Filter to only active steps:
  // A step is "active" if all steps with a lower stepNumber on the same
  // expense are already Approved.
  const activeApprovals = [];

  for (const approval of allPending) {
    const blockers = await Approval.count({
      where: {
        expenseId: approval.expenseId,
        stepNumber: { $lt: approval.stepNumber },
        status: { $ne: 'Approved' },
      },
    });

    // Use Sequelize Op properly
    const { Op } = require('sequelize');
    const blockersCount = await Approval.count({
      where: {
        expenseId: approval.expenseId,
        stepNumber: { [Op.lt]: approval.stepNumber },
        status: { [Op.ne]: 'Approved' },
      },
    });

    if (blockersCount === 0) {
      activeApprovals.push(approval);
    }
  }

  return activeApprovals;
};

/**
 * POST /approvals/:id/approve
 * Approves the given approval step (must belong to currentUser).
 * If this was the last step → marks Expense as Approved.
 * If not → the next step becomes active automatically.
 */
const approveStep = async (currentUser, approvalId, { comments } = {}) => {
  const t = await sequelize.transaction();

  try {
    const { Op } = require('sequelize');

    // Fetch the approval step
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

    // Ensure all previous steps are Approved (enforce order)
    const blockersCount = await Approval.count({
      where: {
        expenseId: approval.expenseId,
        stepNumber: { [Op.lt]: approval.stepNumber },
        status: { [Op.ne]: 'Approved' },
      },
      transaction: t,
    });

    if (blockersCount > 0) {
      throw httpError('Cannot approve: a previous step has not been approved yet.', 409);
    }

    // Mark current step as Approved
    await approval.update({ status: 'Approved', comments: comments || null }, { transaction: t });

    // Check if there is a next step
    const nextStep = await Approval.findOne({
      where: {
        expenseId: approval.expenseId,
        stepNumber: approval.stepNumber + 1,
      },
      transaction: t,
    });

    if (!nextStep) {
      // All steps done → mark expense as Approved
      await Expense.update(
        { status: 'Approved' },
        { where: { id: approval.expenseId }, transaction: t }
      );
    }
    // If nextStep exists it remains 'Pending' and becomes the new active step.

    await t.commit();
    return { message: 'Step approved successfully.', approval };

  } catch (err) {
    await t.rollback();
    throw err;
  }
};

/**
 * POST /approvals/:id/reject
 * Rejects the given approval step.
 * Cascades: remaining steps are cancelled, Expense → Rejected.
 */
const rejectStep = async (currentUser, approvalId, { comments } = {}) => {
  const t = await sequelize.transaction();

  try {
    const { Op } = require('sequelize');

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

    // Enforce step order
    const blockersCount = await Approval.count({
      where: {
        expenseId: approval.expenseId,
        stepNumber: { [Op.lt]: approval.stepNumber },
        status: { [Op.ne]: 'Approved' },
      },
      transaction: t,
    });

    if (blockersCount > 0) {
      throw httpError('Cannot reject: a previous step has not been approved yet.', 409);
    }

    // Mark this step as Rejected
    await approval.update(
      { status: 'Rejected', comments: comments || null },
      { transaction: t }
    );

    // Cancel all remaining (future) Pending steps for this expense
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
