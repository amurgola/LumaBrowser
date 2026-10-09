const ActivityLogExtension = require('./ActivityLogExtension');

const extension = new ActivityLogExtension();

module.exports = {
  activate: (context) => extension.activate(context),
  deactivate: () => extension.deactivate(),
};
