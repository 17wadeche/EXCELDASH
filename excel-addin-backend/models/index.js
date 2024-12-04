// models/index.js

const initializeSequelize = require('../db'); // Adjust the path as necessary

const defineUser = require('./User');
const defineSubscription = require('./Subscription');

let modelsInitialized = false;
let sequelize;
let User, Subscription;

async function initializeModels() {
  if (modelsInitialized) {
    return { sequelize, User, Subscription };
  }

  sequelize = await initializeSequelize();

  User = defineUser(sequelize);
  Subscription = defineSubscription(sequelize);

  // Correct the associations
  User.hasOne(Subscription, { foreignKey: 'userId' });
  Subscription.belongsTo(User, { foreignKey: 'userId' });

  try {
    await sequelize.sync();
    console.log('All models were synchronized successfully.');
    modelsInitialized = true;
  } catch (error) {
    console.error('Unable to sync models:', error);
    throw error;
  }

  return {
    sequelize,
    User,
    Subscription,
  };
}

module.exports = initializeModels;
