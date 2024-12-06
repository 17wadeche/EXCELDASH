// models/Subscription.js

module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define('Subscription', {
    subscription_id: {
      type: DataTypes.STRING(255),
      primaryKey: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    subscription_plan: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    currentPeriodEnd: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    userId: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: {
        model: 'Users', // Ensure this matches your Users table name
        key: 'id',
      },
    },
    paid_amount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
  }, {
    tableName: 'Subscriptions',
    schema: 'dbo', // Specify the correct schema
    timestamps: true, // Disable if you handle timestamps manually
  });
  return Subscription;
};