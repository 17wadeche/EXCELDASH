// models/index.js
const initializeSequelize = require('../db'); // Sequelize initialization
const defineUser = require('./User'); // Define User model
const defineSubscription = require('./Subscription'); // Define Subscription model
let modelsInitialized = false;
let sequelize;
let User, Subscription;
async function initializeModels() {
  if (modelsInitialized) {
    return { sequelize, User, Subscription };
  }
  sequelize = await initializeSequelize();
  User = defineUser(sequelize, sequelize.Sequelize.DataTypes);
  Subscription = defineSubscription(sequelize, sequelize.Sequelize.DataTypes);
  User.hasOne(Subscription, { foreignKey: 'userId' });
  Subscription.belongsTo(User, { foreignKey: 'userId' });
  try {
    await sequelize.sync({alter: true});
    console.log('All models were synchronized successfully.');
    modelsInitialized = true;
  } catch (error) {
    console.error('Unable to sync models:', error);
    throw error;
  }
  return { sequelize, User, Subscription };
}
module.exports = initializeModels;
