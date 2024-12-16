// models/index.js
const initializeSequelize = require('../db');
const defineUser = require('./User');
const defineSubscription = require('./Subscription');
const defineDashboard = require('./Dashboard');
const defineTemplate = require('./Template');
let modelsInitialized = false;
let sequelize;
let User, Subscription, Dashboard, Template;
async function initializeModels() {
  if (modelsInitialized) {
    return { sequelize, User, Subscription, Dashboard };
  }
  sequelize = await initializeSequelize();
  User = defineUser(sequelize, sequelize.Sequelize.DataTypes);
  Subscription = defineSubscription(sequelize, sequelize.Sequelize.DataTypes);
  Dashboard = defineDashboard(sequelize, sequelize.Sequelize.DataTypes);
  Template = defineTemplate(sequelize, sequelize.Sequelize.DataTypes);
  User.hasOne(Subscription, { foreignKey: 'userId' });
  Subscription.belongsTo(User, { foreignKey: 'userId' });
  await sequelize.sync();
  console.log('All models were synchronized successfully.');
  modelsInitialized = true;

  return { sequelize, User, Subscription, Dashboard, Template };
}
module.exports = initializeModels;
