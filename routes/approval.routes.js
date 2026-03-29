'use strict';

const { Router } = require('express');
const Joi = require('joi');
const validate = require('../middleware/validate');
const authenticateUser = require('../middleware/authenticateUser');
const authorizeRoles = require('../middleware/authorizeRoles');
const approvalController = require('../controllers/approval.controller');

const router = Router();

// All approval routes require a valid JWT
router.use(authenticateUser);

// ── Validation schemas ────────────────────────────────────────────────────────

const actionSchema = Joi.object({
  comments: Joi.string().max(500).optional().allow('', null),
});

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/approvals/pending
 * Manager or Admin sees their active pending steps.
 */
router.get(
  '/pending',
  authorizeRoles('Admin', 'Manager'),
  approvalController.getPending
);

/**
 * POST /api/v1/approvals/:id/approve
 * Approve a specific step.
 */
router.post(
  '/:id/approve',
  authorizeRoles('Admin', 'Manager'),
  validate(actionSchema),
  approvalController.approve
);

/**
 * POST /api/v1/approvals/:id/reject
 * Reject a specific step (cascades to remaining steps + expense).
 */
router.post(
  '/:id/reject',
  authorizeRoles('Admin', 'Manager'),
  validate(actionSchema),
  approvalController.reject
);

module.exports = router;
