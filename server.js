'use strict';

const app = require('./app');
const { connectDB } = require('./config/database');
const db = require('./models');
const { port } = require('./config/env');

const start = async () => {
  // 1. Test DB connection
  await connectDB();

  // 2. Sync all Sequelize models (alter: true keeps existing data safe in dev)
  if (process.env.NODE_ENV !== 'production') {
    await db.sequelize.sync({ alter: true });
    console.log('📦  Sequelize models synced.');
  }

  // 3. Start HTTP server
  app.listen(port, () => {
    console.log(`🚀  Server running on http://localhost:${port} [${process.env.NODE_ENV}]`);
  });
};

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
