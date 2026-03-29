'use strict';

module.exports = (sequelize, DataTypes) => {
  const ApprovalRule = sequelize.define(
    'ApprovalRule',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      companyId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'companies', key: 'id' },
      },
      type: {
        type: DataTypes.ENUM('percentage', 'specific', 'hybrid'),
        allowNull: false,
        comment:
          'percentage = based on expense %, specific = fixed approver, hybrid = both',
      },
      value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment:
          'Threshold value — for percentage: the %, for hybrid: the amount threshold',
      },
      specificApproverId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        comment: 'Used when type is "specific" or "hybrid"',
      },
    },
    {
      tableName: 'approval_rules',
      indexes: [{ fields: ['companyId'] }],
    }
  );

  ApprovalRule.associate = (models) => {
    // Belongs to a company
    ApprovalRule.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company',
    });

    // Optionally points to a specific approver user
    ApprovalRule.belongsTo(models.User, {
      foreignKey: 'specificApproverId',
      as: 'specificApprover',
    });
  };

  return ApprovalRule;
};
