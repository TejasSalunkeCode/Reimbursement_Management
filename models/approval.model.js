'use strict';

module.exports = (sequelize, DataTypes) => {
  const Approval = sequelize.define(
    'Approval',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      expenseId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'expenses', key: 'id' },
      },
      approverId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      stepNumber: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
        comment: 'Approval step order (1 = first approver, 2 = second, …)',
      },
      status: {
        type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
        allowNull: false,
        defaultValue: 'Pending',
      },
      comments: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'approvals',
      indexes: [
        { fields: ['expenseId'] },
        { fields: ['approverId'] },
        { unique: true, fields: ['expenseId', 'stepNumber'] },
      ],
    }
  );

  Approval.associate = (models) => {
    // Belongs to the expense it is approving
    Approval.belongsTo(models.Expense, {
      foreignKey: 'expenseId',
      as: 'expense',
    });

    // Belongs to the user who is the approver
    Approval.belongsTo(models.User, {
      foreignKey: 'approverId',
      as: 'approver',
    });
  };

  return Approval;
};
