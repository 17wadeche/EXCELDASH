const initializeModels = require('../models');
const { v4: uuidv4 } = require('uuid');

module.exports = async function (context, req) {
  const method = req.method.toLowerCase();
  const id = req.params.id;
  try {
    const { Dashboard } = await initializeModels();
    if (method === 'post') {
      const { title, components, layouts, workbookId } = req.body;
      console.log("Server: Received POST for dashboard creation. workbookId:", workbookId);
      if (!title || !components || !layouts || !workbookId) {
        context.res = {
          status: 400,
          body: { error: 'title, components, layouts, and workbookId are required.' }
        };
        return;
      }
      const normalizedWorkbookId = workbookId ? workbookId.toLowerCase() : '';
      const newDashboard = await Dashboard.create({
        id: uuidv4(),
        title,
        components,
        layouts,
        workbookId : normalizedWorkbookId,
        versions: [],
      });
      context.res = { status: 200, body: newDashboard };
    } else if (method === 'get') {
      if (id) {
        const dashboard = await Dashboard.findByPk(id);
        console.log("Server: Fetched dashboard from DB:", dashboard);
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
      const { title, components, layouts, workbookId } = req.body;
      console.log("Server: Received PUT for dashboard:", id);
      console.log("Server: Request body workbookId:", workbookId);
      const dashboard = await Dashboard.findByPk(id);
      if (!dashboard) {
        context.res = { status: 404, body: { error: 'Dashboard not found' } };
        return;
      }
      console.log("Server: Existing dashboard workbookId (from DB):", dashboard.workbookId);
      if (title !== undefined) dashboard.title = title;
      if (components !== undefined) dashboard.components = components;
      if (layouts !== undefined) dashboard.layouts = layouts;
      if (workbookId !== undefined) {
        dashboard.workbookId = workbookId.toLowerCase();
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
      const deletedCount = await Dashboard.destroy({ where: { id }});
      if (deletedCount === 0) {
        context.res = { status: 404, body: { error: 'Dashboard not found' } };
      } else {
        context.res = { status: 200, body: { message: 'Dashboard deleted successfully' } };
      }
    } else {
      context.res = { status: 405, body: { error: 'Method not allowed.' } };
    }
  } catch (error) {
    context.log.error('Error handling dashboard request:', error);
    context.res = { status: 500, body: { error: error.message } };
  }
};