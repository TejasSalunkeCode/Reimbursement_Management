'use strict';

const axios = require('axios');
const NodeCache = require('node-cache');

/**
 * TTL-based in-memory cache for exchange rates.
 *  - stdTTL : 1 hour (3600s) — rates are refreshed at most once per hour
 *  - checkperiod : 120s — cache prunes expired keys every 2 minutes
 */
const rateCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

// Base URL for the free Open Exchange Rate API (no key needed)
const BASE_URL = 'https://open.er-api.com/v6/latest';

// ── Country → Currency lookup ─────────────────────────────────────────────────
const COUNTRY_CURRENCY_MAP = {
  // Asia
  India: 'INR', IN: 'INR',
  China: 'CNY', CN: 'CNY',
  Japan: 'JPY', JP: 'JPY',
  'South Korea': 'KRW', KR: 'KRW',
  Singapore: 'SGD', SG: 'SGD',
  UAE: 'AED', AE: 'AED',
  'Saudi Arabia': 'SAR', SA: 'SAR',
  Pakistan: 'PKR', PK: 'PKR',
  Bangladesh: 'BDT', BD: 'BDT',
  Indonesia: 'IDR', ID: 'IDR',
  Malaysia: 'MYR', MY: 'MYR',
  Thailand: 'THB', TH: 'THB',
  Philippines: 'PHP', PH: 'PHP',
  Vietnam: 'VND', VN: 'VND',
  // Europe
  Germany: 'EUR', DE: 'EUR',
  France: 'EUR', FR: 'EUR',
  Italy: 'EUR', IT: 'EUR',
  Spain: 'EUR', ES: 'EUR',
  Netherlands: 'EUR', NL: 'EUR',
  'United Kingdom': 'GBP', GB: 'GBP', UK: 'GBP',
  Switzerland: 'CHF', CH: 'CHF',
  Sweden: 'SEK', SE: 'SEK',
  Norway: 'NOK', NO: 'NOK',
  Denmark: 'DKK', DK: 'DKK',
  Poland: 'PLN', PL: 'PLN',
  // Americas
  'United States': 'USD', US: 'USD', USA: 'USD',
  Canada: 'CAD', CA: 'CAD',
  Brazil: 'BRL', BR: 'BRL',
  Mexico: 'MXN', MX: 'MXN',
  Argentina: 'ARS', AR: 'ARS',
  // Oceania
  Australia: 'AUD', AU: 'AUD',
  'New Zealand': 'NZD', NZ: 'NZD',
  // Africa
  'South Africa': 'ZAR', ZA: 'ZAR',
  Nigeria: 'NGN', NG: 'NGN',
  Egypt: 'EGP', EG: 'EGP',
  Kenya: 'KES', KE: 'KES',
};

/**
 * Returns the ISO 4217 currency code for a country.
 * Falls back to 'USD' for unknown countries.
 *
 * @param {string} country - Country name or 2-letter ISO code
 * @returns {string}
 */
const getCurrencyByCountry = (country) =>
  COUNTRY_CURRENCY_MAP[country] || 'USD';

// ── Exchange rate fetching ─────────────────────────────────────────────────────

/**
 * Fetch exchange rates for a base currency.
 * Rates are cached for 1 hour to avoid hammering the external API.
 *
 * Response shape from open.er-api.com:
 *  { result: 'success', base_code: 'USD', rates: { EUR: 0.92, INR: 83.1, … } }
 *
 * @param {string} baseCurrency - ISO 4217 code (e.g. 'USD')
 * @returns {Promise<Record<string, number>>} map of currency → rate
 */
const fetchRates = async (baseCurrency) => {
  const cacheKey = `rates:${baseCurrency.toUpperCase()}`;
  const cached = rateCache.get(cacheKey);

  if (cached) {
    console.log(`[CurrencyService] Cache HIT for ${baseCurrency}`);
    return cached;
  }

  console.log(`[CurrencyService] Cache MISS — fetching rates for ${baseCurrency}`);
  const url = `${BASE_URL}/${baseCurrency.toUpperCase()}`;

  const { data } = await axios.get(url, { timeout: 8000 });

  if (data.result !== 'success') {
    throw new Error(`Exchange rate API error for ${baseCurrency}: ${data['error-type']}`);
  }

  rateCache.set(cacheKey, data.rates);
  return data.rates;
};

// ── Conversion ────────────────────────────────────────────────────────────────

/**
 * Convert an amount from one currency to another.
 *
 * @param {number} amount       - Original amount
 * @param {string} fromCurrency - Source ISO code (e.g. 'EUR')
 * @param {string} toCurrency   - Target ISO code (e.g. 'INR')
 * @returns {Promise<{ convertedAmount: number, rate: number, fromCurrency: string, toCurrency: string }>}
 */
const convertAmount = async (amount, fromCurrency, toCurrency) => {
  const from = fromCurrency.toUpperCase();
  const to   = toCurrency.toUpperCase();

  if (from === to) {
    return { convertedAmount: parseFloat(amount.toFixed(2)), rate: 1, fromCurrency: from, toCurrency: to };
  }

  // Fetch rates with fromCurrency as base
  const rates = await fetchRates(from);

  if (!rates[to]) {
    throw new Error(`Unsupported target currency: ${to}`);
  }

  const rate            = rates[to];
  const convertedAmount = parseFloat((amount * rate).toFixed(2));

  return { convertedAmount, rate, fromCurrency: from, toCurrency: to };
};

// ── Cache management ──────────────────────────────────────────────────────────

/**
 * Manually flush the rate cache (useful for testing or admin ops).
 */
const flushCache = () => {
  rateCache.flushAll();
  console.log('[CurrencyService] Rate cache flushed.');
};

/**
 * Return cache stats (useful for a monitoring endpoint).
 */
const getCacheStats = () => rateCache.getStats();

module.exports = { getCurrencyByCountry, fetchRates, convertAmount, flushCache, getCacheStats };
