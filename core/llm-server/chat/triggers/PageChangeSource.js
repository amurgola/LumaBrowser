const TriggerSource = require('./TriggerSource');

class PageChangeSource extends TriggerSource {
  static KIND = 'page';
  static EVENT = 'page-changed';

  constructor({ triggerStore, runner, getDetectorApi } = {}) {
    super({ triggerStore, runner, getUpstream: getDetectorApi });
  }

  static eventFor(payload = {}) {
    return {
      receivedAt: new Date().toISOString(),
      event: PageChangeSource.EVENT,
      monitorId: payload.monitorId != null ? String(payload.monitorId) : null,
      monitorName: payload.monitorName || null,
      url: payload.url || null,
      changedAt: payload.timestamp || null,
      checksum: payload.checksum || null,
      prevChecksum: payload.prevChecksum || null,
      diffSummary: payload.diffSummary || '',
      textPreview: payload.textPreview || '',
      textLength: payload.textLength || 0,
      changeCount: payload.changeCount || 0,
    };
  }

  listMonitors() {
    const api = this.upstream();
    if (!api || typeof api.getAllMonitors !== 'function') return [];
    try {
      return (api.getAllMonitors() || []).map((m) => PageChangeSource._monitorFacts(m));
    } catch (_) {
      return [];
    }
  }

  getMonitor(id) {
    return this.listMonitors().find((m) => m.id === String(id)) || null;
  }

  sampleFor(monitorId) {
    const monitor = this.getMonitor(monitorId);
    if (!monitor) throw new Error(`page monitor not found: ${monitorId}`);
    const last = this._latestCheck(monitor.id);
    const event = PageChangeSource.eventFor({
      monitorId: monitor.id,
      monitorName: monitor.name,
      url: monitor.url,
      timestamp: last ? (last.checked_at || last.timestamp || null) : null,
      checksum: last ? last.checksum : null,
      diffSummary: last ? (last.diff_summary || '') : '',
      textPreview: last ? (last.text_preview || '') : '',
      changeCount: monitor.changeCount,
    });
    return { ...event, synthetic: true };
  }

  onChange(payload) {
    if (!payload || payload.monitorId == null || String(payload.monitorId) === '') return [];
    const event = PageChangeSource.eventFor(payload);
    const dedupeKey = event.checksum ? `page:${event.monitorId}:${event.checksum}` : null;
    return this._deliverToMatching(event, dedupeKey);
  }

  _canSubscribe(api) {
    return typeof api.onChange === 'function';
  }

  _subscribe(api, listener) {
    return api.onChange(listener);
  }

  _handle(payload) {
    this.onChange(payload);
  }

  _matchesTrigger(trigger, event) {
    if (!trigger.source || String(trigger.source.monitorId) !== event.monitorId) return false;
    return !!trigger.enabled || !trigger.sample;
  }

  _latestCheck(monitorId) {
    const api = this.upstream();
    try {
      return api && typeof api.getHistory === 'function' ? (api.getHistory(monitorId, 1) || [])[0] || null : null;
    } catch (_) {
      return null;
    }
  }

  static _monitorFacts(m) {
    return {
      id: String(m.id),
      name: m.name || '',
      url: m.url || '',
      enabled: m.enabled !== 0 && m.enabled !== false,
      lastStatus: m.last_status || null,
      changeCount: m.change_count || 0,
    };
  }
}

module.exports = PageChangeSource;
