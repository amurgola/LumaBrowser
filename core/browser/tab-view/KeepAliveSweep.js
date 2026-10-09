const CrashTracer = require('../../diagnostics/CrashTracer');

class KeepAliveSweep {
  static FIRST_SWEEP_DELAY_MS = 60 * 1000;
  static SWEEP_INTERVAL_MS = 60 * 60 * 1000;
  static HEARTBEAT_TIMEOUT_MS = 10 * 1000;

  static ACTIVATION_JS = `(() => {
  try {
    window.dispatchEvent(new Event('focus'));
    document.dispatchEvent(new Event('visibilitychange'));
  } catch (_) {}
  return true;
})()`;

  constructor({ registry, revive }) {
    this._registry = registry;
    this._revive = revive;
    this._initialTimer = null;
    this._interval = null;
  }

  start(runSweep, { initialDelayMs = KeepAliveSweep.FIRST_SWEEP_DELAY_MS, intervalMs = KeepAliveSweep.SWEEP_INTERVAL_MS } = {}) {
    this.stop();
    const run = () => KeepAliveSweep._runReporting(runSweep);
    this._initialTimer = setTimeout(() => { this._initialTimer = null; run(); }, initialDelayMs);
    this._interval = setInterval(run, intervalMs);
  }

  stop() {
    if (this._initialTimer) clearTimeout(this._initialTimer);
    if (this._interval) clearInterval(this._interval);
    this._initialTimer = null;
    this._interval = null;
  }

  async activateAll() {
    const result = { checked: 0, healthy: 0, reloaded: 0, revived: 0 };
    CrashTracer.mark('keepalive:sweep-start');
    for (const entry of this._registry.persisted()) {
      result.checked++;
      const outcome = await this._activate(entry);
      CrashTracer.mark('keepalive:tab', { id: entry.id, outcome });
      result[outcome]++;
    }
    CrashTracer.mark('keepalive:sweep-end', result);
    KeepAliveSweep._logRepairs(result);
    return result;
  }

  static _runReporting(runSweep) {
    runSweep().catch((err) => console.warn('[TabViewManager] keep-alive sweep failed:', err && err.message));
  }

  async _activate(entry) {
    const wc = entry.webContents;
    if (!wc || wc.isDestroyed()) return this._reviveOutcome(entry);
    if (typeof wc.isCrashed === 'function' && wc.isCrashed()) return KeepAliveSweep._reloadOutcome(wc);
    if (wc.isLoading()) return 'healthy';
    if (await KeepAliveSweep._heartbeat(wc)) return 'healthy';
    try {
      wc.reload();
    } catch (_) {
      return this._reviveOutcome(entry);
    }
    return 'reloaded';
  }

  _reviveOutcome(entry) {
    this._revive(entry);
    return 'revived';
  }

  static _reloadOutcome(wc) {
    try { wc.reload(); } catch (_) {}
    return 'reloaded';
  }

  static _heartbeat(wc) {
    if (typeof wc.executeJavaScript !== 'function') return Promise.resolve(true);
    let timer = null;
    const heartbeat = wc.executeJavaScript(KeepAliveSweep.ACTIVATION_JS, true).then(() => true, () => false);
    const timeout = new Promise((resolve) => {
      timer = setTimeout(() => resolve(false), KeepAliveSweep.HEARTBEAT_TIMEOUT_MS);
    });
    return Promise.race([heartbeat, timeout]).finally(() => clearTimeout(timer));
  }

  static _logRepairs(result) {
    if (!result.reloaded && !result.revived) return;
    console.log(`[TabViewManager] keep-alive sweep: ${result.checked} checked, `
      + `${result.reloaded} reloaded, ${result.revived} revived`);
  }
}

module.exports = KeepAliveSweep;
