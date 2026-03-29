'use strict';

const userService = require('../services/user.service');

/**
 * POST /api/v1/users
 * Admin creates a new Employee or Manager.
 */
exports.create = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.user, req.body);
    res.status(201).json({ success: true, message: 'User created successfully.', data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/users
 * Admin gets all users in their company.
 * Optional query params: ?role=Manager&isActive=true
 */
exports.getAll = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers(req.user, req.query);
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/users/:id
 * Admin gets a single user (with manager + subordinates).
 */
exports.getById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.user, req.params.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/users/:id
 * Admin updates a user's name, role, manager, or active status.
 */
exports.update = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.user, req.params.id, req.body);
    res.json({ success: true, message: 'User updated successfully.', data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/users/:id
 * Soft-deletes (deactivates) a user.
 */
exports.remove = async (req, res, next) => {
  try {
    const result = await userService.deleteUser(req.user, req.params.id);
    res.json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
};
