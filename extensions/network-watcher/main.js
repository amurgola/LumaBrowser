const NetworkWatcherExtension = require('./NetworkWatcherExtension');

const extension = new NetworkWatcherExtension();

module.exports = {
  activate: (context) => extension.activate(context),
  deactivate: () => extension.deactivate(),
  getApi: () => extension.getApi(),
};
