const GameRoutes = require('./routes/GameRoutes');

module.exports = function createRoutes(context) {
  return GameRoutes.create(context);
};
