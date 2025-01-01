// users/index.js
const initializeModels = require('../models');
const { Op } = require('sequelize');  // <-- important for the LIKE operator
const authMiddleware = require('../authMiddleware');

module.exports = async function (context, req) {
  await new Promise((resolve) => authMiddleware(context, req, resolve));
  if (context.res && context.res.body && context.res.body.error) {
    return;
  }
  const method = req.method.toLowerCase();
  const search = req.query.search || '';

  try {
    const { User } = await initializeModels();
    if (method === 'get') {
      if (!search) {
        context.res = { status: 200, body: [] };
        return;
      }
      const users = await User.findAll({
        where: {
          userEmail: {
            [Op.like]: `%${search}%`
          }
        },
        limit: 20
      });

      context.res = { status: 200, body: users };
    }
    else {
      context.res = { status: 405, body: { error: 'Method not allowed.' } };
    }
  } catch (err) {
    context.log.error('Error in users function:', err);
    context.res = { status: 500, body: { error: err.message } };
  }
};
