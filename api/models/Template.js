// models/Template.js
const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  const Template = sequelize.define('Template', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
      defaultValue: () => uuidv4()
    },
    name: {
      type: DataTypes.STRING(255),
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
    widgets: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const rawValue = this.getDataValue('widgets');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('widgets', JSON.stringify(value));
      }
    },
    layouts: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const rawValue = this.getDataValue('layouts');
        return rawValue ? JSON.parse(rawValue) : {};
      },
      set(value) {
        this.setDataValue('layouts', JSON.stringify(value));
      }
    },
    sharedWith: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]',
      get() {
        try {
          const rawValue = this.getDataValue('sharedWith');
          return rawValue ? JSON.parse(rawValue) : [];
        } catch {
          return [];
        }
      },
      set(value) {
        this.setDataValue('sharedWith', JSON.stringify(value || []));
      }
    },
  }, {
    tableName: 'Templates',
    timestamps: true,
  });

  return Template;
};
