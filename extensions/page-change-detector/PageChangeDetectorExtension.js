const MonitorSchema = require('./MonitorSchema');
const MonitorRepository = require('./MonitorRepository');
const SnapshotRepository = require('./SnapshotRepository');
const MonitorTabs = require('./MonitorTabs');
const MonitorTextExtractor = require('./MonitorTextExtractor');
const MonitorChecker = require('./MonitorChecker');
const MonitorScheduler = require('./MonitorScheduler');
const MonitorBroadcast = require('./MonitorBroadcast');
const MonitorService = require('./MonitorService');
const ElementPicker = require('./ElementPicker');
const ChangeWebhook = require('./ChangeWebhook');
const DesktopNotifier = require('./DesktopNotifier');
const MonitorIpcHandlers = require('./MonitorIpcHandlers');

class PageChangeDetectorExtension {
  constructor(overrides = {}) {
    this._overrides = overrides;
    this._service = null;
    this._api = null;
  }

  async activate(context) {
    MonitorSchema.ensure(context.db);
    this._service = this._buildService(context);
    const started = this._service.startAll();
    console.log(`page-change-detector: started ${started} enabled monitor(s)`);
    MonitorIpcHandlers.register(context.ipc, this._service);
    this._api = PageChangeDetectorExtension._publicApi(this._service);
    return this._api;
  }

  async deactivate() {
    if (this._service) this._service.stopAll();
    this._service = null;
    this._api = null;
  }

  getApi() {
    return this._api;
  }

  _buildService(context) {
    const monitors = new MonitorRepository(context.db);
    const snapshots = new SnapshotRepository(context.db);
    const tabs = new MonitorTabs(context.browser, this._overrides.sleep ? { sleep: this._overrides.sleep } : {});
    const broadcast = new MonitorBroadcast({ ipc: context.ipc, repository: monitors, ...this._broadcastSend() });
    const checker = new MonitorChecker({
      monitors, snapshots, tabs, broadcast,
      extractor: new MonitorTextExtractor(context.browser),
      webhook: this._overrides.webhook || new ChangeWebhook(),
      notifier: this._overrides.notifier || new DesktopNotifier(),
    });
    const scheduler = new MonitorScheduler({ checker, monitors, broadcast });
    const picker = new ElementPicker({ browser: context.browser, tabs });
    return new MonitorService({ monitors, snapshots, checker, scheduler, picker, broadcast });
  }

  _broadcastSend() {
    return this._overrides.broadcastSend ? { send: this._overrides.broadcastSend } : {};
  }

  static _publicApi(service) {
    return {
      getAllMonitors: () => service.getAllMonitors(),
      getMonitor: (id) => service.getMonitor(id),
      getHistory: (monitorId, limit) => service.getHistory(monitorId, limit),
      getHistoryPaged: (monitorId, options) => service.getHistoryPaged(monitorId, options),
      createMonitor: (data) => service.createMonitor(data),
      updateMonitor: (id, updates) => service.updateMonitor(id, updates),
      deleteMonitor: (id) => service.deleteMonitor(id),
      checkMonitorNow: (id) => service.checkMonitorNow(id),
      pickElementsForMonitor: (id) => service.pickElementsForMonitor(id),
      onChange: (callback) => service.onChange(callback),
    };
  }
}

module.exports = PageChangeDetectorExtension;
