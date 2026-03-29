'use strict';

const { Router } = require('express');
const Joi = require('joi');
const validate = require('../middleware/validate');
const authenticateUser = require('../middleware/authenticateUser');
const authorizeRoles = require('../middleware/authorizeRoles');
const expenseController = require('../controllers/expense.controller');

const router = Router();

// All /expenses routes require a valid JWT
router.use(authenticateUser);

// ── Validation schemas ────────────────────────────────────────────────────────

const submitExpenseSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Amount must be a positive number.',
    'number.base': 'Amount must be a number.',
  }),
  currency: Joi.string()
    .length(3)
    .uppercase()
    .required()
    .messages({ 'string.length': 'Currency must be a 3-letter ISO code (e.g. USD, INR).' }),
  category: Joi.string()
    .valid(
      'Travel',
      'Meals',
      'Accommodation',
      'Office Supplies',
      'Software',
      'Hardware',
      'Training',
      'Medical',
      'Entertainment',
      'Other'
    )
    .required()
    .messages({ 'any.only': 'Invalid category. Choose a valid expense category.' }),
  description: Joi.string().max(500).optional().allow('', null),
  date: Joi.date().iso().max('now').required().messages({
    'date.max': 'Expense date cannot be in the future.',
    'date.format': 'Date must be in YYYY-MM-DD format.',
  }),
});

const myExpensesQuerySchema = Joi.object({
  status: Joi.string().valid('Pending', 'Approved', 'Rejected'),
  category: Joi.string(),
});

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/expenses
 * Employees (and Managers) can submit expenses.
 */
router.post(
  '/',
  authorizeRoles('Employee', 'Manager'),
  validate(submitExpenseSchema),
  expenseController.submit
);

/**
 * GET /api/v1/expenses/my
 * Employee views their own expenses with optional filters.
 * NOTE: must be declared before /:id to avoid route collision.
 */
router.get(
  '/my',
  authorizeRoles('Employee', 'Manager'),
  validate(myExpensesQuerySchema, 'query'),
  expenseController.getMyExpenses
);

/**
 * GET /api/v1/expenses/:id
 * Get a single expense with full approval trail.
 * All roles can use this; service enforces access control per role.
 */
router.get('/:id', expenseController.getById);

module.exports = router;
