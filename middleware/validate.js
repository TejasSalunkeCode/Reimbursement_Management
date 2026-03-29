'use strict';

/**
 * Factory: returns an Express middleware that validates req.body
 * against a Joi schema. Passes a 422 error to next() on failure.
 *
 * Usage:
 *   const { createUserSchema } = require('../middleware/validate');
 *   router.post('/users', validate(createUserSchema), controller.create);
 *
 * @param {import('joi').ObjectSchema} schema - Joi schema to validate against
 * @param {'body'|'query'|'params'} [target='body'] - Part of request to validate
 */
const validate = (schema, target = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[target], {
    abortEarly: false,   // collect ALL errors, not just first
    allowUnknown: false, // reject keys not in schema
    stripUnknown: true,  // remove unknown keys from value
  });

  if (error) {
    const details = error.details.map((d) => d.message);
    const err = new Error('Validation failed');
    err.statusCode = 422;
    err.details = details;

    // Attach details to the JSON response
    const origHandler = next;
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: details,
    });
  }

  // Replace request data with the validated + stripped value
  req[target] = value;
  next();
};

module.exports = validate;
