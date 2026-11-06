const EventEmitter = require('events');
const fs = require('fs');

class DownloadManager extends EventEmitter {
  static HISTORY_LIMIT = 50;
  static DONE_STATES = { completed: 'done', cancelled: 'cancelled' };
  static STORAGE_KEY = 'core.browser.downloads';

  constructor({ db = null } = {}) {
    super();
    this._db = db;
    this.nextId = 1;
    this.downloads = new Map();
    this._load();
  }

  track(item) {
    const info = this._createInfo(this.nextId++, item);
    this.downloads.set(info.id, { info, item });
    this._trim();
    this._emit(info);
    item.on('updated', (_e, state) => this._onUpdated(info, item, state));
    item.once('done', (_e, state) => this._onDone(info, item, state));
    return info;
  }

  list() {
    return [...this.downloads.values()].map((r) => DownloadManager._withPresence(r.info)).reverse();
  }

  get(id) {
    const rec = this.downloads.get(Number(id));
    return rec ? { ...rec.info } : null;
  }

  cancel(id) {
    const rec = this.downloads.get(Number(id));
    if (!rec || !rec.item) return { success: false, error: 'Download is not in progress' };
    try { rec.item.cancel(); } catch (err) { return { success: false, error: err.message }; }
    return { success: true };
  }

  async open(id) {
    const rec = this.downloads.get(Number(id));
    if (!rec || rec.info.state !== 'done' || !rec.info.savePath) return { success: false, error: 'File is not available' };
    try {
      const err = await DownloadManager._shell().openPath(rec.info.savePath);
      return err ? { success: false, error: err } : { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  showInFolder(id) {
    const rec = this.downloads.get(Number(id));
    if (!rec || !rec.info.savePath) return { success: false, error: 'File is not available' };
    try {
      DownloadManager._shell().showItemInFolder(rec.info.savePath);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  clearFinished(sinceMs = null) {
    for (const [id, rec] of this.downloads) {
      if (rec.info.state === 'progress') continue;
      if (sinceMs != null && (rec.info.startedAt || 0) < sinceMs) continue;
      this.downloads.delete(id);
    }
    this._save();
    return { success: true };
  }

  _createInfo(id, item) {
    const safe = DownloadManager._safe;
    return {
      id,
      filename: safe(() => item.getFilename(), 'download'),
      url: safe(() => item.getURL(), ''),
      mimeType: safe(() => item.getMimeType(), ''),
      total: safe(() => item.getTotalBytes(), 0),
      received: 0,
      state: 'progress',
      paused: false,
      savePath: '',
      startedAt: Date.now(),
      finishedAt: null,
    };
  }

  _onUpdated(info, item, state) {
    DownloadManager._refreshProgress(info, item);
    info.paused = DownloadManager._safe(() => item.isPaused(), false);
    info.state = state === 'interrupted' ? 'failed' : 'progress';
    this._emit(info);
  }

  _onDone(info, item, state) {
    DownloadManager._refreshProgress(info, item);
    info.finishedAt = Date.now();
    info.state = DownloadManager.DONE_STATES[state] || 'failed';
    this._releaseItem(info.id);
    this._save();
    this._emit(info);
  }

  _releaseItem(id) {
    const rec = this.downloads.get(id);
    if (rec) rec.item = null;
  }

  _emit(info) {
    this.emit('download', { ...info });
  }

  _trim() {
    while (this.downloads.size > DownloadManager.HISTORY_LIMIT) {
      const oldestFinished = this._oldestFinishedId();
      if (oldestFinished == null) break;
      this.downloads.delete(oldestFinished);
    }
  }

  _oldestFinishedId() {
    for (const [id, rec] of this.downloads) {
      if (rec.info.state !== 'progress') return id;
    }
    return null;
  }

  _load() {
    if (!this._db) return;
    let stored = [];
    try { stored = this._db.get(DownloadManager.STORAGE_KEY, []) || []; } catch (_) { stored = []; }
    if (!Array.isArray(stored)) return;
    for (const raw of stored.slice(-DownloadManager.HISTORY_LIMIT)) {
      if (!raw || !Number.isInteger(raw.id) || raw.state === 'progress') continue;
      this.downloads.set(raw.id, { info: { ...raw, restored: true }, item: null });
      this.nextId = Math.max(this.nextId, raw.id + 1);
    }
  }

  _save() {
    if (!this._db) return;
    const finished = [...this.downloads.values()].map((r) => r.info).filter((info) => info.state !== 'progress')
      .map((info) => { const { restored, missing, ...rest } = info; return rest; });
    try { this._db.set(DownloadManager.STORAGE_KEY, finished); } catch (_) {}
  }

  static _withPresence(info) {
    const out = { ...info };
    if (out.state === 'done' && out.savePath) out.missing = !DownloadManager._exists(out.savePath);
    return out;
  }

  static _exists(path) {
    try { return fs.existsSync(path); } catch (_) { return true; }
  }

  static _refreshProgress(info, item) {
    const safe = DownloadManager._safe;
    info.received = safe(() => item.getReceivedBytes(), info.received);
    info.total = safe(() => item.getTotalBytes(), info.total);
    info.savePath = safe(() => item.getSavePath(), info.savePath);
  }

  static _shell() {
    return require('electron').shell;
  }

  static _safe(fn, fallback) {
    try {
      const value = fn();
      return value === undefined || value === null ? fallback : value;
    } catch (_) {
      return fallback;
    }
  }
}

module.exports = DownloadManager;
