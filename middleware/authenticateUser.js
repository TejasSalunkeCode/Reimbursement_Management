'use strict';

const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware: verifies the Bearer JWT token in the Authorization header.
 * Attaches the decoded user (with DB record) to req.user.
 *
 * Usage: router.get('/protected', authenticateUser, controller.handler)
 */
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: err.name === 'TokenExpiredError' ? 'Token expired.' : 'Invalid token.',
      });
    }

    // Fetch fresh user from DB (ensures account still exists & is active)
    const user = await User.findOne({
      where: { id: decoded.id, isActive: true },
      attributes: ['id', 'name', 'email', 'role', 'companyId', 'managerId'],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists or is inactive.',
      });
    }

    req.user = user; // available downstream as req.user
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = authenticateUser;
