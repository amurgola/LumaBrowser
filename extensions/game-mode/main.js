const GameModeExtension = require('./GameModeExtension');

module.exports = {
  async activate(context) {
    return GameModeExtension.activate(context);
  },

  async deactivate() {},
};
