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
    userId: {
      type: DataTypes.UUID,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    subscriptionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    subscriptionStatus: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    plan: {
      type: DataTypes.STRING,
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
