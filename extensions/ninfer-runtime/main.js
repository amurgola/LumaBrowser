const NinferActivation = require('./NinferActivation');

module.exports = {
  activate: (context) => NinferActivation.activate(context),
  deactivate: async () => {},
};
