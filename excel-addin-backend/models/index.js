const initializeSequelize = require('../db'); // Adjust the path as necessary

const defineUser = require('./User');
const defineLicense = require('./License');
const defineSubscription = require('./Subscription');

let modelsInitialized = false;
let sequelize; // Declare sequelize here
let User, License, Subscription;

async function initializeModels() {
  if (modelsInitialized) {
    return { sequelize, User, License, Subscription };
  }

  sequelize = await initializeSequelize();

  // Define models
  User = defineUser(sequelize);
  License = defineLicense(sequelize);
  Subscription = defineSubscription(sequelize);

  // Define relationships
  User.hasMany(License, { foreignKey: 'userId' });
  License.belongsTo(User, { foreignKey: 'userId' });

  License.hasOne(Subscription, { foreignKey: 'licenseId' });
  Subscription.belongsTo(License, { foreignKey: 'licenseId' });

  // Synchronize models once
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
    License,
    Subscription,
  };
}

module.exports = initializeModels;
