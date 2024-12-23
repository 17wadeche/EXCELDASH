// templates/index.js
const initializeModels = require('../models');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/authMiddleware');

module.exports = async function (context, req) {
  try {
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
    const { Template } = await initializeModels();
    if (method === 'post') {
      const { name, widgets, layouts } = req.body;
      context.log.info("Received POST request for template creation", { userEmail, name });
      if (!name || !widgets || !layouts) {
        context.res = {
          status: 400,
          body: { error: 'name, widgets, and layouts are required.' },
        };
        return;
      }
      const newTemplate = await Template.create({
        id: uuidv4(),
        name,
        widgets,
        layouts,
        userEmail,
      });
      context.res = { status: 200, body: newTemplate };
    } else if (method === 'get') {
      if (id) {
        const template = await Template.findByPk(id);
        if (!template) {
          context.res = { status: 404, body: { error: 'Template not found' } };
          return;
        }
        if (template.userEmail !== userEmail) {
          context.res = { status: 403, body: { error: 'Access denied.' } };
          return;
        }
        context.res = { status: 200, body: template };
      } else {
        const templates = await Template.findAll({
          where: { userEmail },
        });
        context.res = { status: 200, body: templates };
      }
    } else if (method === 'put') {
      if (!id) {
        context.res = {
          status: 400,
          body: { error: 'Template ID is required for updating.' }
        };
        return;
      }
      const { name, widgets, layouts } = req.body;
      const template = await Template.findByPk(id);
      if (!template) {
        context.res = { status: 404, body: { error: 'Template not found' } };
        return;
      }
      if (template.userEmail !== userEmail) {
        context.res = { status: 403, body: { error: 'Access denied.' } };
        return;
      }
      if (name !== undefined) template.name = name;
      if (widgets !== undefined) template.widgets = widgets;
      if (layouts !== undefined) template.layouts = layouts;
      await template.save();
      context.res = { status: 200, body: template };
    } else if (method === 'delete') {
      if (!id) {
        context.res = {
          status: 400,
          body: { error: 'Template ID is required for deleting.' }
        };
        return;
      }
      const template = await Template.findByPk(id);
      if (!template) {
        context.res = { status: 404, body: { error: 'Template not found' } };
        return;
      }
      if (template.userEmail !== userEmail) {
        context.res = { status: 403, body: { error: 'Access denied.' } };
        return;
      }
      await template.destroy();
      context.res = { status: 200, body: { message: 'Template deleted successfully' } };
    } else {
      context.res = { status: 405, body: { error: 'Method not allowed.' } };
    }
  } catch (error) {
    context.log.error('Error handling template request:', { error: error.message, stack: error.stack });
    context.res = { status: 500, body: { error: 'Internal Server Error' } };
  }
};
