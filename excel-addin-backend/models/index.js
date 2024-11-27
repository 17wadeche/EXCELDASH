// models/index.js
const initializeSequelize = require('../db'); // Adjust the path as necessary

const defineUser = require('./User');
const defineLicense = require('./License');
const defineSubscription = require('./Subscription');

async function initializeModels() {
  const sequelize = await initializeSequelize();

  // Define models
  const User = defineUser(sequelize);
  const License = defineLicense(sequelize);
  const Subscription = defineSubscription(sequelize);

  // Define relationships
  User.hasMany(License, { foreignKey: 'userId' });
  License.belongsTo(User, { foreignKey: 'userId' });

  License.hasOne(Subscription, { foreignKey: 'licenseId' });
  Subscription.belongsTo(License, { foreignKey: 'licenseId' });

  // Synchronize Models with Database
  try {
    await sequelize.sync();
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Unable to sync models:', error);
    process.exit(1); // Exit process with failure
  }

  return {
    sequelize,
    User,
    License,
    Subscription,
  };
}

module.exports = initializeModels;
