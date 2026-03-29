'use strict';

const { Expense, Approval, User, Company } = require('../models');

// ── helpers ───────────────────────────────────────────────────────────────────

const httpError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

/** Standard includes for expense queries */
const expenseIncludes = [
  {
    model: User,
    as: 'submittedBy',
    attributes: ['id', 'name', 'email', 'role'],
  },
  {
    model: Approval,
    as: 'approvals',
    attributes: ['id', 'stepNumber', 'status', 'comments', 'createdAt'],
    include: [
      {
        model: User,
        as: 'approver',
        attributes: ['id', 'name', 'email', 'role'],
      },
    ],
    order: [['stepNumber', 'ASC']],
  },
];

// ── service methods ───────────────────────────────────────────────────────────

/**
 * Submit a new expense.
 * - Automatically sets status to 'Pending'.
 * - convertedAmount is null until the approval service processes it.
 */
const submitExpense = async (currentUser, { amount, currency, category, description, date }) => {
  // Fetch the company's base currency for reference (convertedAmount can be
  // populated later by a currency-conversion job or approval flow).
  const company = await Company.findByPk(currentUser.companyId, {
    attributes: ['currency'],
  });

  const expense = await Expense.create({
    userId: currentUser.id,
    amount,
    currency: currency.toUpperCase(),
    convertedAmount: null,         // populated later if currency differs
    category,
    description: description || null,
    date,
    status: 'Pending',
  });

  return getExpenseById(currentUser, expense.id);
};

/**
 * Get all expenses submitted by the current user.
 * Optional filters: ?status=Pending  ?category=Travel
 */
const getMyExpenses = async (currentUser, { status, category } = {}) => {
  const where = { userId: currentUser.id };
  if (status)   where.status   = status;
  if (category) where.category = category;

  return Expense.findAll({
    where,
    include: expenseIncludes,
    order: [['date', 'DESC']],
  });
};

/**
 * Get a single expense by ID.
 * An Employee can only see their own expenses.
 * Admins/Managers can see any expense in their company.
 */
const getExpenseById = async (currentUser, id) => {
  const where = { id };

  // Employees are restricted to their own expenses
  if (currentUser.role === 'Employee') {
    where.userId = currentUser.id;
  }

  const expense = await Expense.findOne({
    where,
    include: [
      ...expenseIncludes,
    ],
  });

  if (!expense) throw httpError(`Expense with id ${id} not found.`, 404);

  // Extra safety: ensure Managers/Admins only see expenses from their company
  if (expense.submittedBy.companyId !== currentUser.companyId) {
    throw httpError('You do not have access to this expense.', 403);
  }

  return expense;
};

module.exports = { submitExpense, getMyExpenses, getExpenseById };
