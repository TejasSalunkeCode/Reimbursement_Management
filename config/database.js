'use strict';

const { Sequelize } = require('sequelize');
const { db } = require('./env');

const sequelize = new Sequelize(db.name, db.user, db.password, {
  host: db.host,
  port: db.port,
  dialect: db.dialect,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    underscored: true,
    timestamps: true,
    freezeTableName: false,
  },
});

/**
 * Test the database connection.
 */
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅  MySQL connected via Sequelize.');
  } catch (error) {
    console.error('❌  Unable to connect to the database:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
