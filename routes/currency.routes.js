'use strict';

const { Router } = require('express');
const authenticateUser = require('../middleware/authenticateUser');
const authorizeRoles = require('../middleware/authorizeRoles');
const { fetchRates, convertAmount, flushCache, getCacheStats, getCurrencyByCountry } = require('../services/currency.service');

const router = Router();

router.use(authenticateUser);

/**
 * GET /api/v1/currency/rates/:base
 * Fetch current exchange rates for a base currency.
 * Served from cache when available.
 * e.g. GET /api/v1/currency/rates/USD
 */
router.get('/rates/:base', async (req, res, next) => {
  try {
    const rates = await fetchRates(req.params.base.toUpperCase());
    res.json({ success: true, base: req.params.base.toUpperCase(), rates });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/currency/convert
 * Convert an amount between two currencies.
 * Query: ?from=USD&to=INR&amount=100
 */
router.get('/convert', async (req, res, next) => {
  try {
    const { from, to, amount } = req.query;
    if (!from || !to || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Query params required: from, to, amount',
      });
    }
    const result = await convertAmount(parseFloat(amount), from, to);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/currency/country/:country
 * Get the currency code for a given country name or ISO code.
 */
router.get('/country/:country', (req, res) => {
  const currency = getCurrencyByCountry(req.params.country);
  res.json({ success: true, country: req.params.country, currency });
});

/**
 * GET /api/v1/currency/cache/stats
 * Admin: see cache hit/miss/key stats.
 */
router.get('/cache/stats', authorizeRoles('Admin'), (req, res) => {
  res.json({ success: true, data: getCacheStats() });
});

/**
 * DELETE /api/v1/currency/cache
 * Admin: manually flush the exchange rate cache.
 */
router.delete('/cache', authorizeRoles('Admin'), (req, res) => {
  flushCache();
  res.json({ success: true, message: 'Exchange rate cache flushed.' });
});

module.exports = router;
