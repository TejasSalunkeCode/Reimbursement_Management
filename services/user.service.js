'use strict';

const { User } = require('../models');

const findAll = async () => {
  return User.findAll({ attributes: { exclude: ['password'] } });
};

const findById = async (id) => {
  const user = await User.findByPk(id, { attributes: { exclude: ['password'] } });
  if (!user) {
    const err = new Error(`User with id ${id} not found`);
    err.statusCode = 404;
    throw err;
  }
  return user;
};

const create = async (data) => {
  // NOTE: Hash password before saving in production (e.g. bcrypt)
  return User.create(data);
};

const update = async (id, data) => {
  const user = await findById(id);
  return user.update(data);
};

const remove = async (id) => {
  const user = await findById(id);
  return user.destroy();
};

module.exports = { findAll, findById, create, update, remove };
