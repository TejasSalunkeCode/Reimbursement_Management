'use strict';

module.exports = (sequelize, DataTypes) => {
  const Company = sequelize.define(
    'Company',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: { notEmpty: true },
      },
      country: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        comment: 'ISO 4217 currency code, e.g. USD, INR',
      },
    },
    {
      tableName: 'companies',
    }
  );

  Company.associate = (models) => {
    // One company has many users
    Company.hasMany(models.User, {
      foreignKey: 'companyId',
      as: 'users',
      onDelete: 'CASCADE',
    });

    // One company has many approval rules
    Company.hasMany(models.ApprovalRule, {
      foreignKey: 'companyId',
      as: 'approvalRules',
      onDelete: 'CASCADE',
    });
  };

  return Company;
};
