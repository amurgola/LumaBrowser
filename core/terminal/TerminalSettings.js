class TerminalSettings {
  static FONT_SIZE_KEY = 'core.terminal.fontSize';
  static FONT_FAMILY_KEY = 'core.terminal.fontFamily';
  static AGENT_ACCESS_KEY = 'core.terminal.agentAccess';
  static DEFAULT_FONT_SIZE = 13;
  static MIN_FONT_SIZE = 8;
  static MAX_FONT_SIZE = 32;
  static DEFAULT_FONT_FAMILY = 'Cascadia Mono, Cascadia Code, Consolas, Menlo, "DejaVu Sans Mono", monospace';
  static MAX_FONT_FAMILY = 200;

  constructor({ db, profiles }) {
    this._db = db;
    this._profiles = profiles;
  }

  view() {
    const chosen = this._profiles.defaultProfile();
    return { fontSize: this.fontSize(), fontFamily: this.fontFamily(), agentAccess: this.agentAccess(), defaultProfile: chosen ? chosen.id : null };
  }

  fontSize() {
    const size = Math.round(Number(this._db.get(TerminalSettings.FONT_SIZE_KEY, TerminalSettings.DEFAULT_FONT_SIZE)));
    return Number.isFinite(size) ? Math.max(TerminalSettings.MIN_FONT_SIZE, Math.min(TerminalSettings.MAX_FONT_SIZE, size)) : TerminalSettings.DEFAULT_FONT_SIZE;
  }

  fontFamily() {
    const family = this._db.get(TerminalSettings.FONT_FAMILY_KEY, '');
    return typeof family === 'string' && family.trim() ? family.trim().slice(0, TerminalSettings.MAX_FONT_FAMILY) : TerminalSettings.DEFAULT_FONT_FAMILY;
  }

  agentAccess() {
    const value = this._db.get(TerminalSettings.AGENT_ACCESS_KEY, false);
    return value === true || value === 'true';
  }

  update(patch = {}) {
    const safe = patch || {};
    if (safe.fontSize !== undefined) this._db.set(TerminalSettings.FONT_SIZE_KEY, Number(safe.fontSize));
    if (safe.fontFamily !== undefined) this._db.set(TerminalSettings.FONT_FAMILY_KEY, String(safe.fontFamily || ''));
    if (safe.agentAccess !== undefined) this._db.set(TerminalSettings.AGENT_ACCESS_KEY, safe.agentAccess === true);
    const chosen = safe.defaultProfile === undefined ? { success: true } : this._profiles.setDefault(safe.defaultProfile);
    return { ...this.view(), success: chosen.success, ...(chosen.success ? {} : { error: chosen.error }) };
  }
}

module.exports = TerminalSettings;
