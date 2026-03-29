'use strict';

/**
 * Receipt text parser — extracts structured fields from raw OCR text.
 * 
 * Extracted fields:
 *   amount      → largest money value found (most likely the total)
 *   date        → first recognisable date string
 *   merchant    → first meaningful non-numeric line (store/brand name)
 *   description → cleaned summary of line items
 *   currency    → detected ISO currency code
 */

// ── Amount patterns ────────────────────────────────────────────────────────────
// Matches: $100.00  ₹1,500  100.00  1,500.00  Total: 500
const AMOUNT_PATTERNS = [
  /(?:total|amount|grand\s*total|subtotal|net\s*total)[:\s]*[\$₹€£¥]?\s*([\d,]+\.?\d{0,2})/gi,
  /[\$₹€£¥]\s*([\d,]+\.?\d{0,2})/g,
  /\b([\d,]+\.\d{2})\b/g,
];

// ── Date patterns ──────────────────────────────────────────────────────────────
const DATE_PATTERNS = [
  // YYYY-MM-DD
  /\b(\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/,
  // DD/MM/YYYY or MM/DD/YYYY
  /\b(\d{1,2}[-/]\d{1,2}[-/]\d{4})\b/,
  // DD Mon YYYY  e.g. 15 Mar 2026
  /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s.,-]+\d{4})\b/i,
  // Mon DD, YYYY  e.g. March 15, 2026
  /\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b/i,
];

// ── Currency symbol → ISO code ─────────────────────────────────────────────────
const SYMBOL_CURRENCY_MAP = {
  '$': 'USD', '£': 'GBP', '€': 'EUR',
  '₹': 'INR', '¥': 'JPY', '₩': 'KRW',
  'USD': 'USD', 'EUR': 'EUR', 'GBP': 'GBP',
  'INR': 'INR', 'JPY': 'JPY', 'AED': 'AED',
  'CAD': 'CAD', 'AUD': 'AUD', 'CHF': 'CHF',
  'SGD': 'SGD', 'MYR': 'MYR', 'THB': 'THB',
};

// ── Lines to skip when identifying merchants ──────────────────────────────────
const SKIP_LINE_PATTERNS = [
  /receipt/i, /invoice/i, /tax\s*invoice/i, /bill/i,
  /thank\s*you/i, /welcome/i, /please\s*come/i,
  /phone/i, /tel/i, /fax/i, /www\./i, /http/i,
  /^\d+$/, /^[\s\-_*=]+$/, /^\s*$/,
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const normaliseAmount = (str) => parseFloat(str.replace(/,/g, ''));

const toISODate = (raw) => {
  if (!raw) return null;
  const d = new Date(raw.replace(/[-./]/g, ' '));
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
};

// ── Main parser ───────────────────────────────────────────────────────────────

/**
 * @param {string} text - Raw OCR text from the receipt
 * @returns {{
 *   amount: number|null,
 *   date: string|null,
 *   merchant: string|null,
 *   description: string|null,
 *   currency: string,
 *   rawText: string,
 *   confidence: object
 * }}
 */
const parseReceiptText = (text) => {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // ── 1. Detect currency ─────────────────────────────────────────────────────
  let currency = 'USD'; // default
  for (const [symbol, code] of Object.entries(SYMBOL_CURRENCY_MAP)) {
    if (text.includes(symbol)) { currency = code; break; }
  }

  // ── 2. Extract amount ──────────────────────────────────────────────────────
  // Strategy: prefer "Total/Amount" labelled values, then take the largest number
  const candidates = [];

  // Priority: labelled totals
  const labelledMatches = [...text.matchAll(AMOUNT_PATTERNS[0])];
  for (const m of labelledMatches) {
    const v = normaliseAmount(m[1]);
    if (!isNaN(v) && v > 0) candidates.push({ value: v, priority: 2 });
  }

  // Symbol-prefixed amounts
  const symbolMatches = [...text.matchAll(AMOUNT_PATTERNS[1])];
  for (const m of symbolMatches) {
    const v = normaliseAmount(m[1]);
    if (!isNaN(v) && v > 0) candidates.push({ value: v, priority: 1 });
  }

  // All decimal numbers (fallback)
  if (!candidates.length) {
    const decimalMatches = [...text.matchAll(AMOUNT_PATTERNS[2])];
    for (const m of decimalMatches) {
      const v = normaliseAmount(m[1]);
      if (!isNaN(v) && v > 0) candidates.push({ value: v, priority: 0 });
    }
  }

  // Sort: highest priority first, then largest value
  candidates.sort((a, b) => b.priority - a.priority || b.value - a.value);
  const amount = candidates.length ? candidates[0].value : null;

  // ── 3. Extract date ────────────────────────────────────────────────────────
  let rawDate = null;
  for (const pattern of DATE_PATTERNS) {
    const m = text.match(pattern);
    if (m) { rawDate = m[1]; break; }
  }
  const date = toISODate(rawDate);

  // ── 4. Extract merchant ────────────────────────────────────────────────────
  // First line that isn't a boilerplate phrase and has at least 2 letters
  let merchant = null;
  for (const line of lines.slice(0, 10)) { // check only top 10 lines
    const skip = SKIP_LINE_PATTERNS.some((p) => p.test(line));
    if (!skip && /[a-zA-Z]{2,}/.test(line) && line.length >= 3) {
      merchant = line.replace(/[^a-zA-Z0-9\s&',.-]/g, '').trim();
      break;
    }
  }

  // ── 5. Extract description ─────────────────────────────────────────────────
  // Collect lines that look like items (contain letters + numbers, reasonable length)
  const itemLines = lines.filter((line) => {
    if (SKIP_LINE_PATTERNS.some((p) => p.test(line))) return false;
    if (line === merchant) return false;
    if (line.length < 3 || line.length > 80) return false;
    return /[a-zA-Z]/.test(line) && /\d/.test(line);
  });

  const description = itemLines.slice(0, 5).join('; ') || null;

  // ── 6. Build confidence scores ─────────────────────────────────────────────
  const confidence = {
    amount:      amount !== null ? 'high' : 'none',
    date:        date   !== null ? 'high' : 'none',
    merchant:    merchant !== null ? 'medium' : 'none',
    description: description !== null ? 'low' : 'none',
  };

  return { amount, date, merchant, description, currency, rawText: text, confidence };
};

module.exports = { parseReceiptText };
