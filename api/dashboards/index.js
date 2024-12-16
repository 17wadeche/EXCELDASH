const Joi = require('joi');
const axios = require('axios');

module.exports = async function (context, req) {
  const method = req.method.toLowerCase();
  const id = req.params.id;

  if (method === 'post') {
    // Create a new dashboard
    const schema = Joi.object({
      name: Joi.string().required(),
      components: Joi.array().items(Joi.object()).required(),
      layouts: Joi.object().required(),
      title: Joi.string().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      context.res = {
        status: 400,
        body: { error: error.details[0].message },
      };
      return;
    }

    try {
      const response = await axios.post('https://your-api-endpoint.com/dashboards', value);
      context.res = {
        status: 200,
        body: response.data,
      };
    } catch (error) {
      context.log.error('Error creating dashboard:', error);
      context.res = {
        status: 500,
        body: { error: error.message },
      };
    }
  } else if (method === 'get') {
    // Retrieve dashboards
    try {
      let url = 'https://your-api-endpoint.com/dashboards';
      if (id) {
        url += `/${id}`;
      }

      const response = await axios.get(url);
      context.res = {
        status: 200,
        body: response.data,
      };
    } catch (error) {
      context.log.error('Error retrieving dashboard(s):', error);
      context.res = {
        status: 500,
        body: { error: error.message },
      };
    }
  } else if (method === 'put') {
    // Update an existing dashboard
    if (!id) {
      context.res = {
        status: 400,
        body: { error: 'Dashboard ID is required for updating.' },
      };
      return;
    }

    const schema = Joi.object({
      name: Joi.string().required(),
      components: Joi.array().items(Joi.object()).required(),
      layouts: Joi.object().required(),
      title: Joi.string().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      context.res = {
        status: 400,
        body: { error: error.details[0].message },
      };
      return;
    }

    try {
      const response = await axios.put(`https://your-api-endpoint.com/dashboards/${id}`, value);
      context.res = {
        status: 200,
        body: response.data,
      };
    } catch (error) {
      context.log.error('Error updating dashboard:', error);
      context.res = {
        status: 500,
        body: { error: error.message },
      };
    }
  } else {
    context.res = {
      status: 405,
      body: { error: 'Method not allowed.' },
    };
  }
};