const RecordId = require('../../core/database/RecordId');
const MonitorFields = require('./MonitorFields');

class MonitorService {
  static NOT_FOUND = 'Monitor not found';

  constructor({ monitors, snapshots, checker, scheduler, picker, broadcast }) {
    this._monitors = monitors;
    this._snapshots = snapshots;
    this._checker = checker;
    this._scheduler = scheduler;
    this._picker = picker;
    this._broadcast = broadcast;
  }

  startAll() {
    const enabled = this._monitors.all().filter((m) => m.enabled);
    for (const monitor of enabled) this._scheduler.start(monitor);
    return enabled.length;
  }

  stopAll() {
    this._scheduler.stopAll();
    this._checker.reset();
  }

  getAllMonitors() {
    return this._monitors.all();
  }

  getMonitor(id) {
    return this._monitors.get(id);
  }

  getHistory(monitorId, limit = 20) {
    return this._snapshots.recent(monitorId, limit);
  }

  getHistoryPaged(monitorId, options = {}) {
    return this._snapshots.paged(monitorId, options);
  }

  createMonitor(data) {
    const id = RecordId.create('mon');
    this._monitors.insert({ id, ...MonitorFields.forCreate(data) });
    const monitor = this._monitors.get(id);
    if (monitor && monitor.enabled) this._scheduler.start(monitor);
    this._broadcast.emit('created', id);
    return monitor;
  }

  updateMonitor(id, updates = {}) {
    if (!this._monitors.get(id)) return null;
    this._monitors.update(id, MonitorFields.forUpdate(updates));
    this._reschedule(id);
    this._broadcast.emit('updated', id);
    return this._monitors.get(id);
  }

  deleteMonitor(id) {
    this._scheduler.stop(id);
    this._snapshots.deleteForMonitor(id);
    const removed = this._monitors.delete(id);
    this._broadcast.emit('deleted', id);
    return removed;
  }

  async checkMonitorNow(id) {
    return this._checker.check(this._requireMonitor(id));
  }

  async pickElementsForMonitor(id) {
    const picked = await this._picker.pick(this._requireMonitor(id));
    if (picked === null) return { cancelled: true };
    return { cancelled: false, selectors: picked, monitor: this.updateMonitor(id, { selectors: picked }) };
  }

  onChange(callback) {
    return this._checker.onChange(callback);
  }

  _reschedule(id) {
    const monitor = this._monitors.get(id);
    this._scheduler.stop(id);
    if (monitor && monitor.enabled) this._scheduler.start(monitor);
    else if (monitor) this._monitors.update(id, { next_run: null });
  }

  _requireMonitor(id) {
    const monitor = this._monitors.get(id);
    if (!monitor) throw new Error(MonitorService.NOT_FOUND);
    return monitor;
  }
}

module.exports = MonitorService;
