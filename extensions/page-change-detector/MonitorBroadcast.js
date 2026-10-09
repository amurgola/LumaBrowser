const RendererBroadcast = require('../../core/shell/extensions/RendererBroadcast');

class MonitorBroadcast {
  constructor({ ipc, repository, send = (channel, payload) => RendererBroadcast.send(channel, payload) }) {
    this._channel = ipc ? `${ipc.namespace}.changed` : null;
    this._repository = repository;
    this._send = send;
  }

  emit(reason, monitorId) {
    if (!this._channel) return;
    this._send(this._channel, { reason, monitorId: monitorId || null, monitor: this._monitor(monitorId) });
  }

  _monitor(monitorId) {
    if (!monitorId) return null;
    try { return this._repository.get(monitorId); } catch (_) { return null; }
  }
}

module.exports = MonitorBroadcast;
