// models/Subscription.js

module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define('Subscription', {
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    subscription_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
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
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('GETDATE()'),
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('GETDATE()'),
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
    timestamps: false, // Disable if you handle timestamps manually
  });
  return Subscription;
};