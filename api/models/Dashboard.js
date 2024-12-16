// models/Dashboard.js
module.exports = (sequelize, DataTypes) => {
  const Dashboard = sequelize.define('Dashboard', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
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
  }, {
    tableName: 'Dashboards', // Ensure this matches your actual table name in the database
    timestamps: true,        // Disable if you don't want automatic timestamps
  });
  return Dashboard;
};
