const NotificationInterceptorExtension = require('./NotificationInterceptorExtension');

const extension = new NotificationInterceptorExtension();

module.exports = {
  activate: (context) => extension.activate(context),
  deactivate: () => extension.deactivate(),
};
