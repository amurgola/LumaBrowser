const crypto = require('crypto');
const ActivityLogSettings = require('./ActivityLogSettings');
const ActivityLogSpanContext = require('./ActivityLogSpanContext');
const ActivityLogCallerLogger = require('./ActivityLogCallerLogger');

class ActivityLogService {
  static PRUNE_INTERVAL_MS = 6 * 60 * 60 * 1000;
  static FIRST_PRUNE_DELAY_MS = 30 * 1000;
  static _STORE_FAILED = Symbol('store failed');

  constructor(store, settingsDb) {
    this._store = store;
    this._settings = new ActivityLogSettings(settingsDb);
    this._observedCallers = new Set();
    this._registeredCallers = new Map();
    this._schedulePrune();
  }

  getSettings() {
    return this._settings.snapshot();
  }

  setSettings(patch = {}) {
    return this._settings.apply(patch);
  }

  registerCaller(caller, meta = {}) {
    if (!caller) return;
    const existing = this._registeredCallers.get(caller) || {};
    this._registeredCallers.set(caller, { ...existing, ...meta });
  }

  unregisterCaller(caller) {
    this._registeredCallers.delete(caller);
  }

  getKnownCallers() {
    const callers = this._collectCallers();
    for (const entry of callers) entry.enabled = this.isEnabled(entry.caller);
    return callers.sort((a, b) => a.caller.localeCompare(b.caller));
  }

  isEnabled(caller) {
    return this._settings.isCallerEnabled(caller);
  }

  log(entry) {
    if (!this._accepts(entry)) return null;
    const ts = entry.ts ?? Date.now();
    const row = this._rowFor(entry, { tsStart: ts, tsEnd: ts, durationMs: 0, result: entry.result ?? 'info' });
    return this._tryStore('insert failed', () => this._store.insert(row), null);
  }

  startSpan(entry) {
    if (!this._accepts(entry)) return null;
    const tsStart = Date.now();
    const correlation = entry.correlation ?? ActivityLogService._newCorrelation();
    const row = this._rowFor(entry, { tsStart, tsEnd: null, durationMs: null, result: 'in_progress', correlation });
    const id = this._tryStore('startSpan insert failed', () => this._store.insert(row), ActivityLogService._STORE_FAILED);
    if (id === ActivityLogService._STORE_FAILED) return null;
    return { id, correlation, tsStart, caller: entry.caller };
  }

  finishSpan(handle, patch = {}) {
    if (!handle) return;
    const tsEnd = Date.now();
    this._tryStore('finishSpan update failed', () => this._store.update(handle.id, {
      tsEnd,
      durationMs: tsEnd - handle.tsStart,
      result: patch.result ?? 'success',
      summary: patch.summary,
      details: patch.details,
    }));
  }

  async span(entry, fn) {
    const handle = this.startSpan(entry);
    if (!handle) return fn(ActivityLogSpanContext.NOOP);
    const spanCtx = new ActivityLogSpanContext(this, handle);
    try {
      const result = await fn(spanCtx);
      this._finishSucceeded(handle, spanCtx);
      return result;
    } catch (err) {
      this._finishFailed(handle, spanCtx, err);
      throw err;
    }
  }

  forCaller(caller, defaultMeta = {}) {
    this.registerCaller(caller, defaultMeta);
    return new ActivityLogCallerLogger(this, caller);
  }

  getEntries(filter) {
    return this._store.query(filter);
  }

  getEntry(id) {
    const entry = this._store.getById(id);
    if (!entry) return null;
    entry.children = this._store.getChildren(id);
    return entry;
  }

  getByCorrelation(correlation) {
    return this._store.getByCorrelation(correlation);
  }

  count() {
    return this._store.count();
  }

  clear() {
    this._store.clear();
  }

  prune() {
    this._tryStore('prune failed', () => this._store.prune(this._settings.pruneLimits()));
  }

  destroy() {
    clearInterval(this._pruneTimer);
    clearTimeout(this._firstPruneTimer);
    try { this._store.close(); } catch (_) {}
  }

  _accepts(entry) {
    if (!entry || !entry.caller || !entry.action) return false;
    if (!this.isEnabled(entry.caller)) return false;
    this._observedCallers.add(entry.caller);
    return true;
  }

  _rowFor(entry, timing) {
    return {
      caller: entry.caller,
      action: entry.action,
      summary: entry.summary ?? null,
      tabId: entry.tabId ?? null,
      url: entry.url ?? null,
      correlation: entry.correlation ?? null,
      parentId: entry.parentId ?? null,
      details: entry.details ?? null,
      ...timing,
    };
  }

  _tryStore(what, action, fallback) {
    try {
      return action();
    } catch (err) {
      console.warn(`ActivityLogService: ${what}:`, err.message);
      return fallback;
    }
  }

  _finishSucceeded(handle, spanCtx) {
    const final = spanCtx.finalPatch();
    this.finishSpan(handle, { result: final.result ?? 'success', summary: final.summary, details: final.details });
  }

  _finishFailed(handle, spanCtx, err) {
    this.finishSpan(handle, {
      result: 'failure',
      summary: err?.message ?? 'Error',
      details: { error: err?.message ?? String(err), stack: err?.stack ?? null, ...(spanCtx.finalPatch().details || {}) },
    });
  }

  _collectCallers() {
    const byCaller = new Map();
    for (const [caller, meta] of this._registeredCallers) {
      byCaller.set(caller, { caller, label: meta.label || caller, description: meta.description || '', source: 'registered' });
    }
    this._addBareCallers(byCaller, this._observedCallers, 'observed');
    this._addBareCallers(byCaller, Object.keys(this._settings.callerOverrides()), 'persisted');
    return [...byCaller.values()];
  }

  _addBareCallers(byCaller, callers, source) {
    for (const caller of callers) {
      if (!byCaller.has(caller)) byCaller.set(caller, { caller, label: caller, description: '', source });
    }
  }

  _schedulePrune() {
    this._pruneTimer = setInterval(() => this.prune(), ActivityLogService.PRUNE_INTERVAL_MS);
    this._firstPruneTimer = setTimeout(() => this.prune(), ActivityLogService.FIRST_PRUNE_DELAY_MS);
    this._pruneTimer.unref?.();
    this._firstPruneTimer.unref?.();
  }

  static _newCorrelation() {
    return crypto.randomBytes(8).toString('hex');
  }
}

module.exports = ActivityLogService;
