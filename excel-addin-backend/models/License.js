// models/License.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const License = sequelize.define('License', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    licenseKey: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    userId: { // Foreign key to Users table
      type: DataTypes.UUID,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    subscriptionId: {
      type: DataTypes.STRING, // Stripe subscription ID
      allowNull: true,
    },
    subscriptionStatus: {
      type: DataTypes.STRING, // 'active', 'past_due', 'canceled', etc.
      allowNull: true,
    },
    plan: {
      type: DataTypes.STRING, // 'monthly', 'yearly', etc.
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'Licenses',
    timestamps: true,
  });
  
  return License;
};
