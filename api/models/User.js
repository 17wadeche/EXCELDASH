// User.js
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid'); 

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        allowNull: false,
        defaultValue: () => uuidv4(),
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      stripeCustomerId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: 'Users',
      timestamps: true,
    }
  );
  User.beforeCreate(async (user) => {
    user.password = await bcrypt.hash(user.password, 10);
  });

  return User;
};
