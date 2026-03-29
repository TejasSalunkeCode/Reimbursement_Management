'use strict';

const { ApprovalRule, Approval, User } = require('../models');

/**
 * Resolves which rules apply to a given expense and builds an ordered
 * array of { approverId, stepNumber } objects.
 *
 * Rule types:
 *  - 'specific'   → always applies; approver = specificApproverId
 *  - 'percentage' → applies when expense.amount >= rule.value;
 *                   approver = employee's direct manager
 *  - 'hybrid'     → applies when expense.amount >= rule.value AND
 *                   specificApproverId is set; approver = specificApproverId
 *
 * @param {object} expense     - The newly created Expense instance
 * @param {object} currentUser - The employee who submitted the expense
 * @param {object} transaction - Sequelize transaction
 */
const buildApprovalChain = async (expense, currentUser, transaction) => {
  // Fetch all rules for the company, ordered by id (defines step priority)
  const rules = await ApprovalRule.findAll({
    where: { companyId: currentUser.companyId },
    order: [['id', 'ASC']],
    transaction,
  });

  if (!rules.length) {
    // No rules defined: auto-approve if no chain needed, handled by caller
    return [];
  }

  const steps = [];

  for (const rule of rules) {
    const amount = parseFloat(expense.amount);

    if (rule.type === 'specific') {
      // Always applies
      if (!rule.specificApproverId) continue;
      steps.push({ approverId: rule.specificApproverId });

    } else if (rule.type === 'percentage') {
      // Applies when expense amount >= threshold value
      if (amount < parseFloat(rule.value || 0)) continue;

      // Approver = the employee's direct manager
      if (!currentUser.managerId) continue; // no manager assigned, skip
      steps.push({ approverId: currentUser.managerId });

    } else if (rule.type === 'hybrid') {
      // Applies when amount >= value AND specificApproverId is set
      if (!rule.specificApproverId) continue;
      if (amount < parseFloat(rule.value || 0)) continue;
      steps.push({ approverId: rule.specificApproverId });
    }
  }

  if (!steps.length) return [];

  // Remove duplicate approvers (keep first occurrence)
  const seen = new Set();
  const uniqueSteps = steps.filter(({ approverId }) => {
    if (seen.has(approverId)) return false;
    seen.add(approverId);
    return true;
  });

  // Persist Approval rows — only step 1 is immediately "Pending";
  // the rest are created as 'Pending' too but won't be "active" until
  // the previous step completes (enforced by the approval service).
  const approvals = await Approval.bulkCreate(
    uniqueSteps.map(({ approverId }, idx) => ({
      expenseId: expense.id,
      approverId,
      stepNumber: idx + 1,
      status: 'Pending',
      comments: null,
    })),
    { transaction }
  );

  return approvals;
};

module.exports = { buildApprovalChain };
