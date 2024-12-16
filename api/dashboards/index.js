const axios = require('axios');

module.exports = async function (context, req) {
  const method = req.method.toLowerCase();
  const id = req.params.id;
  if (method === 'post') {
    try {
      const response = await axios.post('https://happy-forest-059a9d710.4.azurestaticapps.net/api/dashboards', req.body);
      context.res = { status: 200, body: response.data };
    } catch (error) {
      context.log.error('Error creating dashboard:', error);
      context.res = { status: 500, body: { error: error.message } };
    }
  } else if (method === 'get') {
    try {
      let url = 'https://happy-forest-059a9d710.4.azurestaticapps.net/api/dashboards';
      if (id) {
        url += `/${id}`;
      }
      const response = await axios.get(url);
      context.res = { status: 200, body: response.data };
    } catch (error) {
      context.log.error('Error retrieving dashboard(s):', error);
      context.res = { status: 500, body: { error: error.message } };
    }
  } else if (method === 'put') {
    if (!id) {
      context.res = { status: 400, body: { error: 'Dashboard ID is required for updating.' } };
      return;
    }
    try {
      const response = await axios.put(`https://happy-forest-059a9d710.4.azurestaticapps.net/api/dashboards/${id}`, req.body);
      context.res = { status: 200, body: response.data };
    } catch (error) {
      context.log.error('Error updating dashboard:', error);
      context.res = { status: 500, body: { error: error.message } };
    }
  } else {
    context.res = { status: 405, body: { error: 'Method not allowed.' } };
  }
};
