const BasaltActivation = require('./BasaltActivation');

module.exports = {
  activate: (context) => BasaltActivation.activate(context),
  deactivate: async () => {},
};
