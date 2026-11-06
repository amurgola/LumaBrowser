const path = require('path');
const { session, webContents, ipcMain } = require('electron');
const FilterWorkerLauncher = require('./FilterWorkerLauncher');

class AdblockerService {
  static SETTING_KEY = 'core.adblocker.enabled';
  static CACHE_FILE = 'adblocker-engine.bin';
  static ALLOWED_KEY = 'core.adblocker.allowedSites';

  static GHOSTERY_IPC_CHANNELS = [
    '@ghostery/adblocker/inject-cosmetic-filters',
    '@ghostery/adblocker/get-cosmetic-filters',
    '@ghostery/adblocker/is-mutation-observer-enabled',
  ];

  constructor(settingsDb, dataDir) {
    this._settingsDb = settingsDb;
    this._cachePath = path.join(dataDir, AdblockerService.CACHE_FILE);
    this._blocker = null;
    this._enabled = this._settingsDb.get(AdblockerService.SETTING_KEY, true);
    this._seenSessions = new Set();
    this._blockedSessions = new Set();
    this._initializing = null;
    this.ready = false;
  }

  isEnabled() {
    return !!this._enabled;
  }

  hasEngine() {
    return this._blocker !== null;
  }

  async init() {
    if (!this._enabled) return;
    return this._ensureBlocker();
  }

  applyToSession(sess) {
    if (!sess) return;
    this._seenSessions.add(sess);
    if (!this._enabled || !this._blocker || this._blockedSessions.has(sess)) return;
    try {
      AdblockerService._clearGhosteryHandlers();
      this._blocker.enableBlockingInSession(sess);
      this._blockedSessions.add(sess);
    } catch (err) {
      console.warn('[adblocker] enableBlockingInSession failed', err.message);
    }
  }

  async setEnabled(enabled) {
    this._enabled = !!enabled;
    this._settingsDb.set(AdblockerService.SETTING_KEY, this._enabled);
    if (this._enabled) await this._ensureBlocker();
    if (!this._blocker) return;
    for (const sess of this._liveSessions()) this._toggleSession(sess);
  }


  static normalizeHost(host) {
    return String(host || '').trim().toLowerCase().replace(/^www\./, '').replace(/[^a-z0-9.-]/g, '');
  }

  static exceptionsFor(host) {
    const h = AdblockerService.normalizeHost(host);
    return h ? [`@@*$domain=${h}`, `@@||${h}^$elemhide`] : [];
  }

  allowedSites() {
    const list = this._settingsDb.get(AdblockerService.ALLOWED_KEY, []);
    return Array.isArray(list) ? list : [];
  }

  isAllowedSite(host) {
    const h = AdblockerService.normalizeHost(host);
    return !!h && this.allowedSites().some((a) => h === a || h.endsWith(`.${a}`));
  }

  setSiteAllowed(host, allowed) {
    const h = AdblockerService.normalizeHost(host);
    if (!h) return { success: false };
    const list = this.allowedSites().filter((a) => a !== h);
    if (allowed) list.push(h);
    this._settingsDb.set(AdblockerService.ALLOWED_KEY, list.sort());
    if (this._blocker) {
      const filters = AdblockerService.exceptionsFor(h);
      try { this._blocker.updateFromDiff(allowed ? { added: filters } : { removed: filters }); } catch (err) { console.warn('[adblocker] site exception update failed', err.message); }
    }
    return { success: true, allowed: !!allowed };
  }

  async _ensureBlocker() {
    if (this._blocker) return;
    if (!this._initializing) {
      this._initializing = this._buildBlocker().finally(() => { this._initializing = null; });
    }
    return this._initializing;
  }

  async _buildBlocker() {
    try {
      const bytes = await FilterWorkerLauncher.build(this._cachePath);
      const { ElectronBlocker } = require('@ghostery/adblocker-electron');
      this._blocker = ElectronBlocker.deserialize(bytes);
      const allowed = this.allowedSites().flatMap((host) => AdblockerService.exceptionsFor(host));
      if (allowed.length) this._blocker.updateFromDiff({ added: allowed });
      for (const sess of this._liveSessions()) this.applyToSession(sess);
    } catch (err) {
      console.error('[adblocker] failed to build engine', err);
      this._blocker = null;
    }
  }

  _toggleSession(sess) {
    try {
      if (this._enabled) this.applyToSession(sess);
      else this._disableSession(sess);
    } catch (err) {
      console.warn('[adblocker] toggle failed for a session:', err.message);
    }
  }

  _disableSession(sess) {
    if (!this._blockedSessions.has(sess)) return;
    this._blocker.disableBlockingInSession(sess);
    this._blockedSessions.delete(sess);
  }

  _liveSessions() {
    const out = new Set(this._seenSessions);
    for (const wc of webContents.getAllWebContents()) {
      if (wc.session) out.add(wc.session);
    }
    out.add(session.defaultSession);
    return out;
  }

  static _clearGhosteryHandlers() {
    for (const channel of AdblockerService.GHOSTERY_IPC_CHANNELS) {
      try { ipcMain.removeHandler(channel); } catch (_) {}
    }
  }
}

module.exports = AdblockerService;
