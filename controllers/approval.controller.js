'use strict';

const approvalService = require('../services/approval.service');

/**
 * GET /api/v1/approvals/pending
 * Returns all active Pending approval steps assigned to the current user.
 */
exports.getPending = async (req, res, next) => {
  try {
    const approvals = await approvalService.getMyPendingApprovals(req.user);
    res.json({ success: true, data: approvals });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/approvals/:id/approve
 * Approves an approval step; auto-advances chain or marks expense Approved.
 */
exports.approve = async (req, res, next) => {
  try {
    const result = await approvalService.approveStep(req.user, req.params.id, req.body);
    res.json({ success: true, message: result.message, data: result.approval });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/approvals/:id/reject
 * Rejects an approval step; cascades to cancel remaining steps and marks
 * expense as Rejected.
 */
exports.reject = async (req, res, next) => {
  try {
    const result = await approvalService.rejectStep(req.user, req.params.id, req.body);
    res.json({ success: true, message: result.message, data: result.approval });
  } catch (err) {
    next(err);
  }
};
