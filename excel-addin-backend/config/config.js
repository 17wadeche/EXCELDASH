require('dotenv').config();

module.exports = {
  production: {
    dialect: 'mssql',
    host: process.env.SQL_SERVER,
    database: process.env.SQL_DATABASE,
    dialectOptions: {
      authentication: {
        type: 'azure-active-directory-service-principal-secret',
        options: {
          tenantId: process.env.AZURE_TENANT_ID,
          clientId: process.env.AZURE_CLIENT_ID,
          clientSecret: process.env.AZURE_CLIENT_SECRET,
        },
      },
      options: {
        encrypt: true,
        trustServerCertificate: false,
      },
    },
    logging: false,
  },
};