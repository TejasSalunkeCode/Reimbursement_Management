'use strict';

/**
 * Global error-handling middleware.
 * Must be registered LAST in Express (after all routes).
 */
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.nodeEnv === 'production';

  // Log error using Winston
  logger.error(`${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, {
    stack: err.stack
  });

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

module.exports = errorHandler;
