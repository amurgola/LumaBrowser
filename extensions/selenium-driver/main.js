const SeleniumDriverExtension = require('./SeleniumDriverExtension');

const extension = new SeleniumDriverExtension();

module.exports = {
  activate: (context) => extension.activate(context),
  deactivate: () => extension.deactivate(),
};
