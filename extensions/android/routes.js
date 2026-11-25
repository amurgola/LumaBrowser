const DeviceRoutes = require('./web/DeviceRoutes');

module.exports = function createRoutes(context) {
  return DeviceRoutes.create(context);
};
