'use strict';

const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { parseReceiptText } = require('../utils/receiptParser');

// ── Image preprocessing ───────────────────────────────────────────────────────

/**
 * Preprocess image with `sharp` before OCR:
 *  - Convert to greyscale  → removes colour noise
 *  - Normalise levels      → improves contrast
 *  - Sharpen               → makes text edges crisper
 *  - Resize if very small  → prevents Tesseract struggling on tiny images
 *
 * @param {string} inputPath   - Original upload path
 * @returns {Promise<string>}  - Path to preprocessed image (written alongside original)
 */
const preprocessImage = async (inputPath) => {
  const ext      = path.extname(inputPath);
  const outPath  = inputPath.replace(ext, `_processed${ext}`);

  const meta = await sharp(inputPath).metadata();
  const minDim = Math.min(meta.width || 0, meta.height || 0);

  let pipeline = sharp(inputPath)
    .greyscale()
    .normalise()
    .sharpen();

  // Upscale if image is very small (< 600px on either side)
  if (minDim > 0 && minDim < 600) {
    const scale = Math.ceil(600 / minDim);
    pipeline = pipeline.resize({
      width:  (meta.width  || 600) * scale,
      height: (meta.height || 600) * scale,
      fit: 'fill',
    });
  }

  await pipeline.toFile(outPath);
  return outPath;
};

// ── OCR ───────────────────────────────────────────────────────────────────────

/**
 * Run Tesseract OCR on an image file and parse the extracted text.
 *
 * @param {string} imagePath - Absolute path to the uploaded image
 * @returns {Promise<{
 *   amount: number|null,
 *   date: string|null,
 *   merchant: string|null,
 *   description: string|null,
 *   currency: string,
 *   confidence: object,
 *   rawText: string,
 *   ocrConfidence: number
 * }>}
 */
const scanReceipt = async (imagePath) => {
  let processedPath = null;

  try {
    // 1. Preprocess the image
    processedPath = await preprocessImage(imagePath);

    // 2. Run Tesseract (English language)
    const { data } = await Tesseract.recognize(processedPath, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          process.stdout.write(`\r[OCR] Progress: ${(m.progress * 100).toFixed(0)}%`);
        }
      },
    });

    console.log(`\n[OCR] Completed. Tesseract confidence: ${data.confidence.toFixed(1)}%`);

    // 3. Parse the raw text into structured fields
    const parsed = parseReceiptText(data.text);

    return {
      ...parsed,
      ocrConfidence: parseFloat(data.confidence.toFixed(1)),
    };

  } finally {
    // Clean up preprocessed temp file
    if (processedPath && fs.existsSync(processedPath)) {
      fs.unlink(processedPath, () => {}); // non-blocking
    }
  }
};

/**
 * Delete the original upload after processing.
 * Call this after a successful scan (optional — caller decides).
 *
 * @param {string} imagePath
 */
const deleteUpload = (imagePath) => {
  if (imagePath && fs.existsSync(imagePath)) {
    fs.unlink(imagePath, (err) => {
      if (err) console.warn(`[OCR] Could not delete upload: ${imagePath}`);
    });
  }
};

module.exports = { scanReceipt, deleteUpload };
