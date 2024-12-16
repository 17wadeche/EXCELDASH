const initializeModels = require('../models');
const { v4: uuidv4 } = require('uuid');

module.exports = async function (context, req) {
  const method = req.method.toLowerCase();
  const id = req.params.id;
  try {
    const { Dashboard } = await initializeModels();
    if (method === 'post') {
      const { title, components, layouts } = req.body;
      if (!title || !components || !layouts) {
        context.res = {
          status: 400,
          body: { error: 'title, components, and layouts are required.' }
        };
        return;
      }
      const newDashboard = await Dashboard.create({
        id: uuidv4(),
        title,
        components,
        layouts
      });
      context.res = { status: 200, body: newDashboard };

    } else if (method === 'get') {
      if (id) {
        const dashboard = await Dashboard.findByPk(id);
        if (!dashboard) {
          context.res = { status: 404, body: { error: 'Dashboard not found' } };
        } else {
          context.res = { status: 200, body: dashboard };
        }
      } else {
        const dashboards = await Dashboard.findAll();
        context.res = { status: 200, body: dashboards };
      }
    } else if (method === 'put') {
      if (!id) {
        context.res = {
          status: 400,
          body: { error: 'Dashboard ID is required for updating.' }
        };
        return;
      }
      const { title, components, layouts } = req.body;
      const dashboard = await Dashboard.findByPk(id);
      if (!dashboard) {
        context.res = { status: 404, body: { error: 'Dashboard not found' } };
        return;
      }
      if (title !== undefined) dashboard.title = title;
      if (components !== undefined) dashboard.components = components;
      if (layouts !== undefined) dashboard.layouts = layouts;
      await dashboard.save();
      context.res = { status: 200, body: dashboard };
    } else {
      context.res = { status: 405, body: { error: 'Method not allowed.' } };
    }
  } catch (error) {
    context.log.error('Error handling dashboard request:', error);
    context.res = { status: 500, body: { error: error.message } };
  }
};
