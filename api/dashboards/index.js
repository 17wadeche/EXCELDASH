// dashboard/index.js

const initializeModels = require('../models');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/authMiddleware'); // Adjust the path as needed

module.exports = async function (context, req) {
  await new Promise((resolve) => authMiddleware(context, req, resolve));
  const method = req.method.toLowerCase();
  const id = req.params.id;
  const userEmail = req.userEmail;
  
  if (!userEmail) {
    context.res = {
      status: 401,
      body: { error: 'Unauthorized access.' },
    };
    return;
  }

  try {
    const { Dashboard } = await initializeModels();

    if (method === 'post') {
      const { title, components, layouts, workbookId, borderSettings } = req.body;
      console.log("Server: Received POST for dashboard creation. userEmail:", userEmail);
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
        const dashboard = await Dashboard.findByPk(id);
        console.log("Server: Fetched dashboard from DB:", dashboard);
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
        const dashboards = await Dashboard.findAll({
          where: { userEmail },
        });
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
      const { title, components, layouts, workbookId, borderSettings } = req.body;
      console.log("Server: Received PUT for dashboard:", id);
      console.log("Server: Request body workbookId:", workbookId);
      const dashboard = await Dashboard.findByPk(id);
      if (!dashboard) {
        context.res = { status: 404, body: { error: 'Dashboard not found' } };
        return;
      }
      if (dashboard.userEmail !== userEmail) {
        context.res = { status: 403, body: { error: 'Access denied.' } };
        return;
      }
      console.log("Server: Existing dashboard workbookId (from DB):", dashboard.workbookId);
      if (title !== undefined) dashboard.title = title;
      if (components !== undefined) dashboard.components = components;
      if (layouts !== undefined) dashboard.layouts = layouts;
      if (workbookId !== undefined) {
        dashboard.workbookId = workbookId.toLowerCase();
      }
      if (borderSettings !== undefined) {
        dashboard.borderSettings = borderSettings;
      }
      await dashboard.save();
      context.res = { status: 200, body: dashboard };
    } else if (method === 'delete') {
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
