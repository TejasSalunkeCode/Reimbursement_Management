'use strict';

const userService = require('../services/user.service');

/**
 * GET /api/v1/users
 */
exports.getAll = async (req, res, next) => {
  try {
    const users = await userService.findAll();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/users/:id
 */
exports.getById = async (req, res, next) => {
  try {
    const user = await userService.findById(req.params.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/users
 */
exports.create = async (req, res, next) => {
  try {
    const user = await userService.create(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/users/:id
 */
exports.update = async (req, res, next) => {
  try {
    const user = await userService.update(req.params.id, req.body);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/users/:id
 */
exports.remove = async (req, res, next) => {
  try {
    await userService.remove(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
};
