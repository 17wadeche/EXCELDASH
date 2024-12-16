const Joi = require('joi');
const axios = require('axios');

module.exports = async function (context, req) {
  const method = req.method.toLowerCase();
  const id = req.params.id;

  if (method === 'post') {
    // Create a new template
    const schema = Joi.object({
      name: Joi.string().required(),
      content: Joi.string().required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      context.res = { status: 400, body: { error: error.details[0].message } };
      return;
    }

    try {
      const response = await axios.post('https://your-api-endpoint.com/templates', value);
      context.res = { status: 200, body: response.data };
    } catch (error) {
      context.log.error('Error creating template:', error);
      context.res = { status: 500, body: { error: error.message } };
    }
  } else if (method === 'get') {
    // Retrieve templates
    try {
      let url = 'https://your-api-endpoint.com/templates';
      if (id) url += `/${id}`;

      const response = await axios.get(url);
      context.res = { status: 200, body: response.data };
    } catch (error) {
      context.log.error('Error retrieving template(s):', error);
      context.res = { status: 500, body: { error: error.message } };
    }
  } else if (method === 'put') {
    // Update an existing template
    if (!id) {
      context.res = { status: 400, body: { error: 'Template ID is required for updating.' } };
      return;
    }

    const schema = Joi.object({
      name: Joi.string().required(),
      content: Joi.string().required(),
      // Add other necessary fields
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      context.res = { status: 400, body: { error: error.details[0].message } };
      return;
    }

    try {
      const response = await axios.put(`https://your-api-endpoint.com/templates/${id}`, value);
      context.res = { status: 200, body: response.data };
    } catch (error) {
      context.log.error('Error updating template:', error);
      context.res = { status: 500, body: { error: error.message } };
    }
  } else {
    context.res = { status: 405, body: { error: 'Method not allowed.' } };
  }
};