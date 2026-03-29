'use strict';

/**
 * Maps country names/codes to ISO 4217 currency codes.
 * Extend as needed.
 */
const COUNTRY_CURRENCY_MAP = {
  // Asia
  India: 'INR',
  IN: 'INR',
  China: 'CNY',
  CN: 'CNY',
  Japan: 'JPY',
  JP: 'JPY',
  'South Korea': 'KRW',
  KR: 'KRW',
  Singapore: 'SGD',
  SG: 'SGD',
  UAE: 'AED',
  AE: 'AED',
  'Saudi Arabia': 'SAR',
  SA: 'SAR',

  // Europe
  Germany: 'EUR',
  DE: 'EUR',
  France: 'EUR',
  FR: 'EUR',
  Italy: 'EUR',
  IT: 'EUR',
  Spain: 'EUR',
  ES: 'EUR',
  'United Kingdom': 'GBP',
  GB: 'GBP',
  UK: 'GBP',
  Switzerland: 'CHF',
  CH: 'CHF',

  // Americas
  'United States': 'USD',
  US: 'USD',
  USA: 'USD',
  Canada: 'CAD',
  CA: 'CAD',
  Brazil: 'BRL',
  BR: 'BRL',
  Mexico: 'MXN',
  MX: 'MXN',

  // Oceania
  Australia: 'AUD',
  AU: 'AUD',
  'New Zealand': 'NZD',
  NZ: 'NZD',
};

/**
 * Returns the currency code for a given country.
 * Falls back to 'USD' if country is unknown.
 *
 * @param {string} country
 * @returns {string} ISO 4217 currency code
 */
const getCurrencyByCountry = (country) => {
  return COUNTRY_CURRENCY_MAP[country] || 'USD';
};

module.exports = { getCurrencyByCountry };
