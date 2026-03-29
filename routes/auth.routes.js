'use strict';

const { Router } = require('express');
const Joi = require('joi');
const validate = require('../middleware/validate');
const authController = require('../controllers/auth.controller');

const router = Router();

// ── Validation schemas ────────────────────────────────────────────────────────

const signupSchema = Joi.object({
  companyName: Joi.string().min(2).max(150).required(),
  country: Joi.string().min(2).max(100).required(),
  adminName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters',
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/signup
 * Creates a company + admin user; returns JWT token and role.
 */
router.post('/signup', validate(signupSchema), authController.signup);

/**
 * POST /api/v1/auth/login
 * Validates credentials; returns JWT token and role.
 */
router.post('/login', validate(loginSchema), authController.login);

module.exports = router;
