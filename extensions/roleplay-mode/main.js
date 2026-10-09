const RoleplayExtension = require('./RoleplayExtension');

const extension = new RoleplayExtension();

module.exports = {
  activate: (context) => extension.activate(context),
  deactivate: () => extension.deactivate(),
};
