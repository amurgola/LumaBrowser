const NotificationService = require('./NotificationService');
const NotificationIpcHandlers = require('./NotificationIpcHandlers');

class NotificationInterceptorExtension {
  constructor() {
    this._service = null;
  }

  async activate(context) {
    this._service = new NotificationService({ db: context.db.getRawDb() });
    NotificationIpcHandlers.register(context.ipc, this._service);
    return this._api();
  }

  async deactivate() {
    this._service = null;
  }

  _api() {
    const service = this._service;
    return {
      getWebhookUrl: () => service.getWebhookUrl(),
      setWebhookUrl: (url) => service.setWebhookUrl(url),
      getLog: () => service.entries(),
      getCount: () => service.count(),
      onIngest: (cb) => service.onIngest(cb),
    };
  }
}

module.exports = NotificationInterceptorExtension;
