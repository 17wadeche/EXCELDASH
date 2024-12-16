const initializeModels = require('../models');
const { v4: uuidv4 } = require('uuid');

module.exports = async function (context, req) {
  const method = req.method.toLowerCase();
  const id = req.params.id;

  try {
    const { Template } = await initializeModels();

    if (method === 'post') {
      const { name, widgets, layouts } = req.body;
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
        layouts
      });
      context.res = { status: 200, body: newTemplate };
    } else if (method === 'get') {
      if (id) {
        const template = await Template.findByPk(id);
        if (!template) {
          context.res = { status: 404, body: { error: 'Template not found' } };
        } else {
          context.res = { status: 200, body: template };
        }
      } else {
        const templates = await Template.findAll();
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
      if (name !== undefined) template.name = name;
      if (widgets !== undefined) template.widgets = widgets;
      if (layouts !== undefined) template.layouts = layouts;

      await template.save();
      context.res = { status: 200, body: template };
    } else {
      context.res = { status: 405, body: { error: 'Method not allowed.' } };
    }
  } catch (error) {
    context.log.error('Error handling template request:', error);
    context.res = { status: 500, body: { error: error.message } };
  }
};
