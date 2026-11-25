const AndroidExtension = require('./AndroidExtension');

const extension = new AndroidExtension();

module.exports = {
  activate: (context) => extension.activate(context),
  deactivate: () => extension.deactivate(),
  getExtension: () => extension,
};
