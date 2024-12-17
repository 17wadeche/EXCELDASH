// models/index.js
const initializeSequelize = require('../db');
const defineUser = require('./User');
const defineSubscription = require('./Subscription');
const defineDashboard = require('./Dashboard');
const defineTemplate = require('./Template');
async function initializeModels() {
  const sequelize = await initializeSequelize();
  const User = defineUser(sequelize, sequelize.Sequelize.DataTypes);
  const Subscription = defineSubscription(sequelize, sequelize.Sequelize.DataTypes);
  const Dashboard = defineDashboard(sequelize, sequelize.Sequelize.DataTypes);
  const Template = defineTemplate(sequelize, sequelize.Sequelize.DataTypes);
  User.hasOne(Subscription, { foreignKey: 'userId' });
  Subscription.belongsTo(User, { foreignKey: 'userId' });
  await sequelize.sync();
  console.log('All models were synchronized successfully.');
  return { sequelize, User, Subscription, Dashboard, Template };
}
module.exports = initializeModels;
