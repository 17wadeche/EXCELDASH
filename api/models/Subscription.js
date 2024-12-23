// models/Subscription.js

module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define('Subscription', {
    subscription_id: {
      type: DataTypes.STRING(255),
      primaryKey: true,
      allowNull: false,
    },
    userEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      references: {
        model: 'Users',
        key: 'userEmail',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
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