'use strict';

const { scanReceipt, deleteUpload } = require('../services/ocr.service');

/**
 * POST /api/v1/ocr/scan
 * Accepts a multipart receipt image, runs OCR, returns structured fields
 * ready to auto-fill the expense submission form.
 */
exports.scan = async (req, res, next) => {
  const imagePath = req.file?.path;

  try {
    if (!imagePath) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Send a receipt image as multipart/form-data under the field "receipt".',
      });
    }

    const result = await scanReceipt(imagePath);

    // Optionally keep or delete the upload
    const keepFile = req.query.keep === 'true';
    if (!keepFile) deleteUpload(imagePath);

    return res.json({
      success: true,
      message: 'Receipt scanned successfully.',
      data: {
        // Pre-filled expense form fields
        expenseForm: {
          amount:      result.amount,
          currency:    result.currency,
          date:        result.date,
          description: result.merchant
            ? `${result.merchant}${result.description ? ' — ' + result.description : ''}`
            : result.description,
          category: 'Other', // user should override
        },
        // Raw extraction details
        extraction: {
          merchant:      result.merchant,
          description:   result.description,
          rawText:       result.rawText,
          ocrConfidence: result.ocrConfidence,
          fieldConfidence: result.confidence,
        },
      },
    });

  } catch (err) {
    // Clean up on error
    deleteUpload(imagePath);
    next(err);
  }
};
