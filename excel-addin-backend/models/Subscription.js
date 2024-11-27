// models/Subscription.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Subscription = sequelize.define('Subscription', {
    id: {
      type: DataTypes.STRING, // Stripe subscription ID
      primaryKey: true,
    },
    licenseId: {
      type: DataTypes.UUID,
      references: {
        model: 'Licenses',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.STRING, // 'active', 'past_due', 'canceled', etc.
      allowNull: false,
    },
    plan: {
      type: DataTypes.STRING, // 'monthly', 'yearly', etc.
      allowNull: false,
    },
    currentPeriodEnd: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    tableName: 'Subscriptions',
    timestamps: true,
  });
  
  return Subscription;
};
