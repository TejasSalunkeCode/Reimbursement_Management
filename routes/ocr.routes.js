'use strict';

const { Router } = require('express');
const authenticateUser = require('../middleware/authenticateUser');
const authorizeRoles = require('../middleware/authorizeRoles');
const { upload } = require('../middleware/upload');
const ocrController = require('../controllers/ocr.controller');

const router = Router();

// All OCR routes require authentication
router.use(authenticateUser);

/**
 * POST /api/v1/ocr/scan
 *
 * Upload a receipt image → OCR extraction → pre-filled expense form fields.
 *
 * Request:  multipart/form-data, field name: "receipt"
 * Response: { expenseForm: { amount, currency, date, description, category },
 *             extraction:  { merchant, rawText, ocrConfidence, fieldConfidence } }
 *
 * Query:    ?keep=true   → keep original file after scan (default: deleted)
 *
 * Roles:   Employee, Manager (anyone who can submit expenses)
 */
router.post(
  '/scan',
  authorizeRoles('Employee', 'Manager', 'Admin'),
  (req, res, next) => {
    // Handle multer errors gracefully (file too large, wrong type, etc.)
    upload.single('receipt')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload failed.',
        });
      }
      next();
    });
  },
  ocrController.scan
);

module.exports = router;
