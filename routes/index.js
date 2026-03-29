'use strict';

const { Router } = require('express');

const router = Router();

// ── Health check ──────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'API is running 🚀', timestamp: new Date() });
});

// ── Feature routes (uncomment / add as you build them) ────────────────────────
const userRoutes = require('./user.routes');
router.use('/users', userRoutes);

module.exports = router;
