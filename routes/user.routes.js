'use strict';

const { Router } = require('express');
const Joi = require('joi');
const validate = require('../middleware/validate');
const authenticateUser = require('../middleware/authenticateUser');
const authorizeRoles = require('../middleware/authorizeRoles');
const userController = require('../controllers/user.controller');

const router = Router();

// All /users routes require a valid JWT + Admin role
router.use(authenticateUser, authorizeRoles('Admin'));

// ── Validation schemas ────────────────────────────────────────────────────────

const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters.',
  }),
  role: Joi.string().valid('Manager', 'Employee').required().messages({
    'any.only': 'Role must be either Manager or Employee.',
  }),
  managerId: Joi.number().integer().positive().optional().allow(null).messages({
    'number.base': 'managerId must be a valid user ID.',
  }),
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  role: Joi.string().valid('Manager', 'Employee').messages({
    'any.only': 'Role must be either Manager or Employee.',
  }),
  managerId: Joi.number().integer().positive().optional().allow(null),
  isActive: Joi.boolean(),
}).min(1); // at least one field required

const listQuerySchema = Joi.object({
  role: Joi.string().valid('Admin', 'Manager', 'Employee'),
  isActive: Joi.string().valid('true', 'false'),
});

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/users
 * Create a new Manager or Employee in the Admin's company.
 */
router.post('/', validate(createUserSchema), userController.create);

/**
 * GET /api/v1/users
 * List all users in the Admin's company.
 * Optional: ?role=Manager  ?isActive=true
 */
router.get('/', validate(listQuerySchema, 'query'), userController.getAll);

/**
 * GET /api/v1/users/:id
 * Get a single user (with manager + subordinates).
 */
router.get('/:id', userController.getById);

/**
 * PUT /api/v1/users/:id
 * Update name, role, managerId, or isActive.
 */
router.put('/:id', validate(updateUserSchema), userController.update);

/**
 * DELETE /api/v1/users/:id
 * Soft-delete (deactivate) a user.
 */
router.delete('/:id', userController.remove);

module.exports = router;
