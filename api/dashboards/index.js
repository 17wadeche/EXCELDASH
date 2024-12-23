// dashboard/index.js
const initializeModels = require('../models');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../authMiddleware');

module.exports = async function (context, req) {
  await new Promise((resolve) => authMiddleware(context, req, resolve));
  if (context.res && context.res.body && context.res.body.error) {
    return;
  }
  const method = req.method.toLowerCase();
  const id = req.params.id;
  const userEmail = req.userEmail;
  if (!userEmail) {
    context.res = {
      status: 401,
      body: { error: 'Unauthorized access (missing userEmail).' },
    };
    return;
  }
  try {
    context.log('About to initialize models...');
    const { Dashboard } = await initializeModels();
    context.log('Models initialized successfully.');
    if (method === 'post') {
      const { title, components, layouts, workbookId, borderSettings } = req.body;
      context.log('POST to /api/dashboards by userEmail:', userEmail);
      if (!title || !components || !layouts || !workbookId) {
        context.res = {
          status: 400,
          body: { error: 'title, components, layouts, and workbookId are required.' }
        };
        return;
      }
      const normalizedWorkbookId = workbookId.toLowerCase();
      const newDashboard = await Dashboard.create({
        id: uuidv4(),
        title,
        components,
        layouts,
        workbookId: normalizedWorkbookId,
        userEmail,
        versions: [],
        borderSettings: borderSettings || undefined,
      });
      context.res = { status: 200, body: newDashboard };
    } else if (method === 'get') {
      if (id) {
        context.log('GET single dashboard by ID:', id);
        const dashboard = await Dashboard.findByPk(id);
        if (!dashboard) {
          context.res = { status: 404, body: { error: 'Dashboard not found' } };
          return;
        }
        if (dashboard.userEmail !== userEmail) {
          context.res = { status: 403, body: { error: 'Access denied.' } };
          return;
        }
        context.res = { status: 200, body: dashboard };
      } else {
        context.log('GET all dashboards for user:', userEmail);
        const dashboards = await Dashboard.findAll({ where: { userEmail } });
        context.res = { status: 200, body: dashboards };
      }
    } else if (method === 'put') {
      context.log('PUT /dashboards/:id ->', id);
      if (!id) {
        context.res = {
          status: 400,
          body: { error: 'Dashboard ID is required for updating.' }
        };
        return;
      }
      const { title, components, layouts, workbookId, borderSettings } = req.body;
      const dashboard = await Dashboard.findByPk(id);
      if (!dashboard) {
        context.res = { status: 404, body: { error: 'Dashboard not found' } };
        return;
      }
      if (dashboard.userEmail !== userEmail) {
        context.res = { status: 403, body: { error: 'Access denied.' } };
        return;
      }
      if (title !== undefined) dashboard.title = title;
      if (components !== undefined) dashboard.components = components;
      if (layouts !== undefined) dashboard.layouts = layouts;
      if (workbookId !== undefined) dashboard.workbookId = workbookId.toLowerCase();
      if (borderSettings !== undefined) dashboard.borderSettings = borderSettings;
      await dashboard.save();
      context.res = { status: 200, body: dashboard };
    } else if (method === 'delete') {
      context.log('DELETE /dashboards/:id ->', id);
      if (!id) {
        context.res = {
          status: 400,
          body: { error: 'Dashboard ID is required for deleting.' }
        };
        return;
      }
      const dashboard = await Dashboard.findByPk(id);
      if (!dashboard) {
        context.res = { status: 404, body: { error: 'Dashboard not found' } };
        return;
      }
      if (dashboard.userEmail !== userEmail) {
        context.res = { status: 403, body: { error: 'Access denied.' } };
        return;
      }
      await dashboard.destroy();
      context.res = { status: 200, body: { message: 'Dashboard deleted successfully' } };
    } else {
      context.res = { status: 405, body: { error: 'Method not allowed.' } };
    }
  } catch (error) {
    context.log.error('Error handling dashboard request:', error);
    context.res = { status: 500, body: { error: error.message } };
  }
};
