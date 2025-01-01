// models/Dashboard.js
module.exports = (sequelize, DataTypes) => {
  const Dashboard = sequelize.define('Dashboard', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
    },
    title: {
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
    components: {
      type: DataTypes.TEXT, 
      allowNull: false,
      get() {
        const rawValue = this.getDataValue('components');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('components', JSON.stringify(value));
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
    workbookId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    versions: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]',
      get() {
        const rawValue = this.getDataValue('versions');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('versions', JSON.stringify(value));
      }
    },
    borderSettings: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: JSON.stringify({
        showBorder: false,
        color: '#000000',
        thickness: 1,
        style: 'solid',
      }),
      get() {
        const rawValue = this.getDataValue('borderSettings');
        return rawValue ? JSON.parse(rawValue) : {
          showBorder: false,
          color: '#000000',
          thickness: 1,
          style: 'solid',
        };
      },
      set(value) {
        this.setDataValue('borderSettings', JSON.stringify(value));
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
    tableName: 'Dashboards',
    timestamps: true,
  });
  return Dashboard;
};