'use strict';

const bcrypt = require('bcrypt');
const { User } = require('../models');
const { Op } = require('sequelize');

const SALT_ROUNDS = 12;

// ── shared query options ───────────────────────────────────────────────────────
const USER_SAFE_ATTRIBUTES = ['id', 'name', 'email', 'role', 'companyId', 'managerId', 'isActive', 'createdAt'];

const managerInclude = {
  model: User,
  as: 'manager',
  attributes: ['id', 'name', 'email', 'role'],
  required: false,
};

// ── helpers ───────────────────────────────────────────────────────────────────

/**
 * Throw a typed HTTP error.
 */
const httpError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

/**
 * Ensure a manager candidate exists, belongs to the same company, and has
 * the 'Manager' (or 'Admin') role.
 */
const validateManager = async (managerId, companyId) => {
  if (!managerId) return; // managerId is optional

  const manager = await User.findOne({ where: { id: managerId, companyId, isActive: true } });
  if (!manager) {
    throw httpError('Assigned manager not found in your company.', 404);
  }
  if (!['Admin', 'Manager'].includes(manager.role)) {
    throw httpError('Assigned manager must have the Admin or Manager role.', 422);
  }
};

// ── service methods ───────────────────────────────────────────────────────────

/**
 * Create a new user (Employee or Manager) within the Admin's company.
 */
const createUser = async (adminUser, { name, email, password, role, managerId }) => {
  // Prevent creating another Admin
  if (role === 'Admin') {
    throw httpError('Cannot create another Admin. Only one Admin per company is allowed.', 403);
  }

  // Unique email check
  const existing = await User.findOne({ where: { email } });
  if (existing) throw httpError('Email already in use.', 409);

  // Validate manager if provided
  await validateManager(managerId, adminUser.companyId);

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
    companyId: adminUser.companyId,
    managerId: managerId || null,
  });

  return getUserById(adminUser, user.id);
};

/**
 * List all users in the Admin's company (excluding passwords).
 */
const getAllUsers = async (adminUser, { role, isActive } = {}) => {
  const where = { companyId: adminUser.companyId };

  if (role) where.role = role;
  if (isActive !== undefined) where.isActive = isActive === 'true' || isActive === true;

  return User.findAll({
    where,
    attributes: USER_SAFE_ATTRIBUTES,
    include: [managerInclude],
    order: [['createdAt', 'DESC']],
  });
};

/**
 * Get a single user by ID, scoped to the Admin's company.
 */
const getUserById = async (adminUser, id) => {
  const user = await User.findOne({
    where: { id, companyId: adminUser.companyId },
    attributes: USER_SAFE_ATTRIBUTES,
    include: [
      managerInclude,
      {
        model: User,
        as: 'subordinates',
        attributes: ['id', 'name', 'email', 'role'],
      },
    ],
  });

  if (!user) throw httpError(`User with id ${id} not found in your company.`, 404);
  return user;
};

/**
 * Update a user's name, role, managerId, or active status.
 * Prevents demoting the Admin or assigning invalid managers.
 */
const updateUser = async (adminUser, id, { name, role, managerId, isActive }) => {
  const user = await User.findOne({ where: { id, companyId: adminUser.companyId } });
  if (!user) throw httpError(`User with id ${id} not found in your company.`, 404);

  // Guard: cannot change the Admin's own role
  if (user.role === 'Admin') {
    throw httpError('Admin account cannot be updated through this endpoint.', 403);
  }

  // Guard: cannot promote to Admin
  if (role === 'Admin') {
    throw httpError('Cannot assign the Admin role to another user.', 403);
  }

  // Validate new manager if provided
  if (managerId !== undefined) {
    // Prevent self-assignment as manager
    if (Number(managerId) === Number(id)) {
      throw httpError('A user cannot be their own manager.', 422);
    }
    await validateManager(managerId, adminUser.companyId);
  }

  await user.update({
    ...(name !== undefined && { name }),
    ...(role !== undefined && { role }),
    ...(managerId !== undefined && { managerId: managerId || null }),
    ...(isActive !== undefined && { isActive }),
  });

  return getUserById(adminUser, id);
};

/**
 * Soft-delete a user (sets isActive = false).
 * Hard-delete is intentionally avoided to preserve audit trails.
 */
const deleteUser = async (adminUser, id) => {
  const user = await User.findOne({ where: { id, companyId: adminUser.companyId } });
  if (!user) throw httpError(`User with id ${id} not found in your company.`, 404);

  if (user.role === 'Admin') {
    throw httpError('Admin account cannot be deleted.', 403);
  }

  await user.update({ isActive: false });
  return { message: `User "${user.name}" has been deactivated.` };
};

module.exports = { createUser, getAllUsers, getUserById, updateUser, deleteUser };
