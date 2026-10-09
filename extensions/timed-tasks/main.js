const TimedTasksExtension = require('./TimedTasksExtension');

const extension = new TimedTasksExtension();

module.exports = {
  activate: (context) => extension.activate(context),
  deactivate: () => extension.deactivate(),
  getApi: () => extension.getApi(),
};
