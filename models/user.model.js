'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: { notEmpty: true },
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('Admin', 'Manager', 'Employee'),
        allowNull: false,
        defaultValue: 'Employee',
      },
      companyId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'companies', key: 'id' },
      },
      managerId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        comment: 'Self-referencing FK — the direct manager of this user',
      },
    },
    {
      tableName: 'users',
    }
  );

  User.associate = (models) => {
    // Belongs to a company
    User.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company',
    });

    // Self-relation: a user has one manager (another User)
    User.belongsTo(models.User, {
      foreignKey: 'managerId',
      as: 'manager',
    });

    // Self-relation: a manager has many subordinates
    User.hasMany(models.User, {
      foreignKey: 'managerId',
      as: 'subordinates',
    });

    // A user submits many expenses
    User.hasMany(models.Expense, {
      foreignKey: 'userId',
      as: 'expenses',
      onDelete: 'CASCADE',
    });

    // A user can be an approver on many approvals
    User.hasMany(models.Approval, {
      foreignKey: 'approverId',
      as: 'approvals',
    });

    // A user can be the specific approver in many approval rules
    User.hasMany(models.ApprovalRule, {
      foreignKey: 'specificApproverId',
      as: 'approvalRules',
    });
  };

  return User;
};
