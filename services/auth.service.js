'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Company, User } = require('../models');
const { getCurrencyByCountry } = require('../utils/currencyHelper');

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ── helpers ───────────────────────────────────────────────────────────────────

const generateToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);

const comparePassword = (plain, hashed) => bcrypt.compare(plain, hashed);

// ── service methods ───────────────────────────────────────────────────────────

/**
 * Signup: create Company + Admin user atomically.
 * Currency is auto-resolved from the country name.
 */
const signup = async ({ companyName, country, adminName, email, password }) => {
  // Ensure email is unique
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    const err = new Error('An account with this email already exists');
    err.statusCode = 409;
    throw err;
  }

  // Resolve currency from country
  const currency = getCurrencyByCountry(country);

  // Create company
  const company = await Company.create({ name: companyName, country, currency });

  // Hash password and create Admin user
  const hashedPassword = await hashPassword(password);
  const admin = await User.create({
    name: adminName,
    email,
    password: hashedPassword,
    role: 'Admin',
    companyId: company.id,
    managerId: null,
  });

  const token = generateToken({
    id: admin.id,
    role: admin.role,
    companyId: company.id,
  });

  return {
    token,
    user: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
    company: {
      id: company.id,
      name: company.name,
      country: company.country,
      currency: company.currency,
    },
  };
};

/**
 * Login: validate credentials and return JWT + role.
 */
const login = async ({ email, password }) => {
  const user = await User.findOne({
    where: { email, isActive: true },
    include: [{ association: 'company', attributes: ['id', 'name', 'currency'] }],
  });

  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken({
    id: user.id,
    role: user.role,
    companyId: user.companyId,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
    },
  };
};

module.exports = { signup, login };
