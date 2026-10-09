class ActivityLogSettings {
  static KEY = 'core.activityLog';

  static DEFAULTS = Object.freeze({
    enabled: false,
    enabledCallers: {},
    retentionDays: 7,
    retentionMaxRows: 10000,
  });

  static DAY_MS = 24 * 60 * 60 * 1000;

  constructor(settingsDb) {
    this._settingsDb = settingsDb;
    this._settings = this._load();
  }

  snapshot() {
    return JSON.parse(JSON.stringify(this._settings));
  }

  apply(patch = {}) {
    const next = { ...this._settings };
    this._applySwitch(next, patch);
    this._applyRetention(next, patch);
    this._applyCallerOverrides(next, patch);
    this._settings = next;
    this._settingsDb.set(ActivityLogSettings.KEY, this._settings);
    return this.snapshot();
  }

  isCallerEnabled(caller) {
    if (!this._settings.enabled) return false;
    return this.callerOverrides()[caller] !== false;
  }

  callerOverrides() {
    return this._settings.enabledCallers || {};
  }

  pruneLimits() {
    const { retentionDays, retentionMaxRows } = this._settings;
    return {
      maxAgeMs: retentionDays > 0 ? retentionDays * ActivityLogSettings.DAY_MS : null,
      maxRows: retentionMaxRows > 0 ? retentionMaxRows : null,
    };
  }

  _load() {
    const raw = this._settingsDb.get(ActivityLogSettings.KEY, {}) || {};
    const settings = { ...ActivityLogSettings.DEFAULTS, ...raw };
    if (!settings.enabledCallers || typeof settings.enabledCallers !== 'object') settings.enabledCallers = {};
    return settings;
  }

  _applySwitch(next, patch) {
    if (typeof patch.enabled === 'boolean') next.enabled = patch.enabled;
  }

  _applyRetention(next, patch) {
    if (Number.isFinite(patch.retentionDays)) next.retentionDays = Math.max(0, patch.retentionDays);
    if (Number.isFinite(patch.retentionMaxRows)) next.retentionMaxRows = Math.max(0, patch.retentionMaxRows);
  }

  _applyCallerOverrides(next, patch) {
    if (ActivityLogSettings._isObject(patch.enabledCallers)) {
      next.enabledCallers = { ...next.enabledCallers, ...patch.enabledCallers };
    }
    if (ActivityLogSettings._isObject(patch.replaceEnabledCallers)) {
      next.enabledCallers = { ...patch.replaceEnabledCallers };
    }
  }

  static _isObject(value) {
    return !!value && typeof value === 'object';
  }
}

module.exports = ActivityLogSettings;
