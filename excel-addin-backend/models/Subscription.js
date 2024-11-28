const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Subscription = sequelize.define('Subscription', {
    id: {
      type: DataTypes.STRING,
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
      type: DataTypes.STRING,
      allowNull: false,
    },
    plan: {
      type: DataTypes.STRING,
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
