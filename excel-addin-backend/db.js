// db.js
const { Sequelize } = require('sequelize');
const { ClientSecretCredential } = require('@azure/identity');
const tenantId = process.env.AZURE_TENANT_ID;
const clientId = process.env.AZURE_CLIENT_ID;
const clientSecret = process.env.AZURE_CLIENT_SECRET;
const sqlServer = process.env.SQL_SERVER;
const sqlDatabase = process.env.SQL_DATABASE; 
const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
async function getAccessToken() {
  try {
    const tokenResponse = await credential.getToken('https://database.windows.net/.default');
    return tokenResponse.token;
  } catch (error) {
    console.error('Error acquiring Azure AD token:', error);
    throw error; 
  }
}
async function initializeSequelize() {
  try {
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
        options: {
          encrypt: true,
          trustServerCertificate: false,
        },
      },
      logging: console.log, 
    });
    await sequelize.authenticate();
    console.log('Azure AD Authentication: Connection has been established successfully.');
    return sequelize;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error; 
  }
}
module.exports = initializeSequelize;
