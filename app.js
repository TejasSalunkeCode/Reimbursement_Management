'use strict';

require('dotenv').config();

const express = require('express');
const morgan = require('morgan');

const { port, nodeEnv } = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Request logging ────────────────────────────────────────────────────────────
app.use(morgan(nodeEnv === 'production' ? 'combined' : 'dev'));

// ── Body parsers ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── API routes ─────────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ── 404 handler ────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global error handler (MUST be last) ───────────────────────────────────────
app.use(errorHandler);

module.exports = app;
