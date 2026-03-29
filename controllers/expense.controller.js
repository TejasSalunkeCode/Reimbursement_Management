'use strict';

const expenseService = require('../services/expense.service');

/**
 * POST /api/v1/expenses
 * Employee submits a new expense.
 */
exports.submit = async (req, res, next) => {
  try {
    const expense = await expenseService.submitExpense(req.user, req.body);
    res.status(201).json({
      success: true,
      message: 'Expense submitted successfully.',
      data: expense,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/expenses/my
 * Employee views their own expenses.
 * Optional: ?status=Pending  ?category=Travel
 */
exports.getMyExpenses = async (req, res, next) => {
  try {
    const expenses = await expenseService.getMyExpenses(req.user, req.query);
    res.json({ success: true, data: expenses });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/expenses/:id
 * Get a single expense with full approval trail.
 * Employees can only access their own; Admin/Manager can access any in company.
 */
exports.getById = async (req, res, next) => {
  try {
    const expense = await expenseService.getExpenseById(req.user, req.params.id);
    res.json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
};
