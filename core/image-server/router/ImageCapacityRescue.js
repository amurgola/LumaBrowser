const MeasuredFootprintStore = require('../../placement/service/MeasuredFootprintStore');

class ImageCapacityRescue {
  static GIB = 1024 * 1024 * 1024;
  static MARGIN_BYTES = ImageCapacityRescue.GIB;
  static LOG_LINES = 40;
  static SIGNATURE = /failed during (weight preparation|workspace preparation|workspace allocation|workspace capacity check|allocated capacity check|output cache allocation)|out of memory|cudaMalloc failed/i;
  static BUDGET_ENTRY = /cuda\d+=([\d.]+)/gi;

  constructor({ getSettingsDb, log = () => {} }) {
    this._getSettingsDb = getSettingsDb;
    this._log = log;
  }

  async prepare(server, modelId, since = null) {
    if (!modelId || !ImageCapacityRescue.ranOutOfRoom(server, since)) return false;
    const need = ImageCapacityRescue.neededBytes(server);
    if (!need) return false;
    this._record(modelId, need);
    try {
      await server.stop();
    } catch (_) {
      return false;
    }
    this._log(`[image-server] ${modelId} ran out of room on its card; it now asks for ${(need / ImageCapacityRescue.GIB).toFixed(1)} GiB and is placed again.`);
    return true;
  }

  static ranOutOfRoom(server, since = null) {
    const logs = ImageCapacityRescue._logs(server);
    const recent = Number.isFinite(since)
      ? logs.filter((entry) => !(entry && Number.isFinite(entry.ts)) || entry.ts >= since)
      : logs.slice(-ImageCapacityRescue.LOG_LINES);
    return recent.some((entry) => ImageCapacityRescue.SIGNATURE.test(ImageCapacityRescue._lineOf(entry)));
  }

  static _lineOf(entry) {
    if (entry && typeof entry === 'object') return String(entry.line || '');
    return String(entry || '');
  }

  static neededBytes(server) {
    const budget = ImageCapacityRescue.budgetBytes(server && server.plan && server.plan.maxVram);
    return budget > 0 ? budget + ImageCapacityRescue.MARGIN_BYTES : null;
  }

  static budgetBytes(text) {
    if (typeof text !== 'string') return 0;
    let total = 0;
    for (const match of text.matchAll(ImageCapacityRescue.BUDGET_ENTRY)) total += Number(match[1]) || 0;
    return Math.round(total * ImageCapacityRescue.GIB);
  }

  _record(modelId, need) {
    try {
      const store = new MeasuredFootprintStore(this._getSettingsDb());
      const peak = Math.max(store.peakVramBytes(modelId), need);
      store.merge({ [modelId]: { modelKey: modelId, peakVramBytes: peak, vramApprox: true, source: 'capacity-failure', ranAt: new Date().toISOString() } });
    } catch (_) {}
  }

  static _logs(server) {
    try {
      const status = server && typeof server.getStatus === 'function' ? server.getStatus() : null;
      return status && Array.isArray(status.logs) ? status.logs : [];
    } catch (_) {
      return [];
    }
  }
}

module.exports = ImageCapacityRescue;
