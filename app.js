'use strict';

require('dotenv').config();

const express = require('express');
const morgan = require('morgan');

const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const { port, nodeEnv } = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Security Headers ───────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ───────────────────────────────────────────────────────────────────────
app.use(cors());

// ── Compression ────────────────────────────────────────────────────────────────
app.use(compression());

// ── Rate Limiting ──────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', limiter);

// ── Request logging ────────────────────────────────────────────────────────────
app.use(morgan(nodeEnv === 'production' ? 'combined' : 'dev'));

// ── Body parsers ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // Limit body size to 10kb
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── API routes ─────────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ── 404 handler ────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global error handler (MUST be last) ───────────────────────────────────────
app.use(errorHandler);

module.exports = app;
