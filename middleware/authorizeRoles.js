'use strict';

/**
 * Middleware factory: restricts access to users whose role is in `allowedRoles`.
 * Must be used AFTER authenticateUser (requires req.user to be set).
 *
 * Usage:
 *   router.post('/admin-only', authenticateUser, authorizeRoles('Admin'), handler)
 *   router.post('/managers',   authenticateUser, authorizeRoles('Admin', 'Manager'), handler)
 *
 * @param {...string} allowedRoles - One or more of 'Admin', 'Manager', 'Employee'
 */
const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated.',
    });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}.`,
    });
  }

  next();
};

module.exports = authorizeRoles;
