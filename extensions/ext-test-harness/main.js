const TestHarnessExtension = require('./TestHarnessExtension');

const extension = new TestHarnessExtension();

module.exports = {
  activate: (context) => extension.activate(context),
  deactivate: () => extension.deactivate(),
};
