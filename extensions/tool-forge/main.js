const ToolForgeExtension = require('./ToolForgeExtension');

const extension = new ToolForgeExtension();

module.exports = {
  activate: (context) => extension.activate(context),
  deactivate: () => extension.deactivate(),
};
