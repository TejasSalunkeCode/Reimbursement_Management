'use strict';

const { Router } = require('express');

const router = Router();

// ── Health check ──────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'API is running 🚀', timestamp: new Date() });
});

// ── Feature routes ───────────────────────────────────────────────────────────
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);

module.exports = router;
