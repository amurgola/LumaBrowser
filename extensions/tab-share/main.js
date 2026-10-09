const TabShareExtension = require('./TabShareExtension');

const extension = new TabShareExtension();

module.exports = {
  activate: (context) => extension.activate(context),
  deactivate: () => extension.deactivate(),
};
