'use strict';

const { Router } = require('express');
const Joi = require('joi');
const validate = require('../middleware/validate');
const userController = require('../controllers/user.controller');

const router = Router();

// ── Schemas ───────────────────────────────────────────────────────────────────
const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'user').default('user'),
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  email: Joi.string().email(),
  role: Joi.string().valid('admin', 'user'),
}).min(1); // at least one field

// ── Routes ────────────────────────────────────────────────────────────────────
router.get('/',    userController.getAll);
router.get('/:id', userController.getById);
router.post('/',   validate(createUserSchema), userController.create);
router.put('/:id', validate(updateUserSchema), userController.update);
router.delete('/:id', userController.remove);

module.exports = router;
