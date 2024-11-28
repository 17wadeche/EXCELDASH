const { Sequelize } = require('sequelize');
const { ClientSecretCredential } = require('@azure/identity');
require('dotenv').config();

// Azure AD Credentials from .env
const tenantId = process.env.AZURE_TENANT_ID;
const clientId = process.env.AZURE_CLIENT_ID;
const clientSecret = process.env.AZURE_CLIENT_SECRET;

// Azure SQL Configuration
const sqlServer = process.env.SQL_SERVER;
const sqlDatabase = process.env.SQL_DATABASE;

// Initialize Azure AD Credential
const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

// Function to get Access Token
async function getAccessToken() {
  try {
    const tokenResponse = await credential.getToken('https://database.windows.net/.default');
    return tokenResponse.token;
  } catch (error) {
    console.error('Error acquiring Azure AD token:', error);
    throw error;
  }
}

// Function to initialize Sequelize
async function initializeSequelize() {
  const accessToken = await getAccessToken();

  const sequelize = new Sequelize(sqlDatabase, null, null, {
    host: sqlServer,
    dialect: 'mssql',
    dialectOptions: {
      authentication: {
        type: 'azure-active-directory-access-token',
        options: {
          token: accessToken,
        },
      },
      encrypt: true,
      trustServerCertificate: false,
      options: {
        connectTimeout: 30000,
      },
    },
    logging: false,
  });

  try {
    await sequelize.authenticate();
    console.log('Azure AD Authentication: Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }

  return sequelize;
}

module.exports = initializeSequelize;
