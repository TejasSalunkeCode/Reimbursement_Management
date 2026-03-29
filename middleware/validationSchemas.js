const Joi = require('joi');

const signupSchema = Joi.object({
  companyName: Joi.string().required().min(2).max(100),
  country: Joi.string().required(),
  currency: Joi.string().required().length(3),
  name: Joi.string().required().min(2).max(100),
  email: Joi.string().email().required(),
  password: Joi.string().required().min(6),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const expenseSchema = Joi.object({
  amount: Joi.number().positive().required(),
  currency: Joi.string().required().length(3),
  category: Joi.string().required(),
  description: Joi.string().allow('', null).max(500),
  date: Joi.date().iso().required(),
});

const userSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  email: Joi.string().email().required(),
  password: Joi.string().required().min(6),
  role: Joi.string().valid('Admin', 'Manager', 'Employee').required(),
  managerId: Joi.number().integer().allow(null),
});

module.exports = {
  signupSchema,
  loginSchema,
  expenseSchema,
  userSchema,
};
