const initializeModels = require('../models');
const Joi = require('joi');

module.exports = async function (context, req) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
  });
  const { error, value } = schema.validate(req.body);
  if (error) {
    context.res = {
      status: 400,
      body: { error: error.details[0].message },
    };
    return;
  }
  const { email, password } = value;
  try {
    const { User } = await initializeModels();
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      context.res = {
        status: 400,
        body: { error: 'Email is already registered.' },
      };
      return;
    }
    await User.create({ email, password });
    context.res = {
      status: 201,
      body: { message: 'User registered successfully.' },
    };
  } catch (error) {
    context.log.error('Error registering user:', error);
    context.res = {
      status: 500,
      body: { error: 'Internal Server Error' },
    };
  }
};
