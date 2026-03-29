'use strict';

module.exports = (sequelize, DataTypes) => {
  const Expense = sequelize.define(
    'Expense',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: { min: 0 },
      },
      currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        comment: 'ISO 4217 currency code of the original expense',
      },
      convertedAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        comment: 'Amount converted to the company base currency',
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: { isDate: true },
      },
      status: {
        type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
        allowNull: false,
        defaultValue: 'Pending',
      },
    },
    {
      tableName: 'expenses',
      indexes: [
        { fields: ['userId'] },
        { fields: ['status'] },
        { fields: ['date'] },
      ],
    }
  );

  Expense.associate = (models) => {
    // Belongs to the employee who submitted it
    Expense.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'submittedBy',
    });

    // One expense goes through many approval steps
    Expense.hasMany(models.Approval, {
      foreignKey: 'expenseId',
      as: 'approvals',
      onDelete: 'CASCADE',
    });
  };

  return Expense;
};
