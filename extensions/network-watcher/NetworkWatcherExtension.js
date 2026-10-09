const WatcherIpcHandlers = require('./WatcherIpcHandlers');

class NetworkWatcherExtension {
  static MISSING_SERVICE = 'network-watcher: core networkWatcherService not available, cannot activate';

  constructor() {
    this._service = null;
    this._activeApi = null;
  }

  async activate(context) {
    this._service = NetworkWatcherExtension._requireService(context.sharedServices);
    WatcherIpcHandlers.register(context.ipc, this._service);
    this._activeApi = this._api();
    return this._activeApi;
  }

  getApi() {
    return this._activeApi;
  }

  async deactivate() {
    this._service = null;
    this._activeApi = null;
  }

  _api() {
    const service = this._service;
    return {
      getWatcherService: () => service,
      getAllWatchers: () => service.getAllWatchers(),
      getStats: () => service.getStats(),
    };
  }

  static _requireService(sharedServices) {
    const service = sharedServices && sharedServices.networkWatcherService;
    if (!service) throw new Error(NetworkWatcherExtension.MISSING_SERVICE);
    return service;
  }
}

module.exports = NetworkWatcherExtension;
