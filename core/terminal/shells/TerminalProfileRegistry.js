const ShellProfiles = require('./ShellProfiles');
const CliAppCatalog = require('./CliAppCatalog');
const TerminalProfileContributions = require('./TerminalProfileContributions');

class TerminalProfileRegistry {
  static CUSTOM_KEY = 'core.terminal.profiles';
  static DEFAULT_KEY = 'core.terminal.defaultProfile';
  static HOST_FAMILIES = ['powershell', 'bash', 'zsh', 'fish', 'cmd'];
  static MAX_LABEL = 60;

  constructor({ db, detectShells = ShellProfiles.detect, detectApps = CliAppCatalog.detect, contributions = TerminalProfileContributions.shared }) {
    this._db = db;
    this._detectShells = detectShells;
    this._detectApps = detectApps;
    this._contributions = contributions;
    this._detected = null;
  }

  list() {
    const detected = this._detect();
    return [...detected.shells, ...detected.apps, ...this._contributedProfiles(), ...this._customProfiles()];
  }

  get(id) {
    return this.list().find((profile) => profile.id === id) || null;
  }

  defaultProfile() {
    const chosen = this.get(this._db.get(TerminalProfileRegistry.DEFAULT_KEY, null));
    return chosen || this._detect().shells[0] || null;
  }

  setDefault(id) {
    if (!this.get(id)) return { success: false, error: 'Unknown terminal profile' };
    this._db.set(TerminalProfileRegistry.DEFAULT_KEY, id);
    return { success: true };
  }

  hostShell() {
    const shells = this._detect().shells;
    const chosen = this.defaultProfile();
    if (chosen && chosen.kind === 'shell' && TerminalProfileRegistry.HOST_FAMILIES.includes(chosen.family)) return chosen;
    for (const family of TerminalProfileRegistry.HOST_FAMILIES) {
      const shell = shells.find((profile) => profile.family === family);
      if (shell) return shell;
    }
    return shells[0] || null;
  }

  refresh() {
    this._detected = null;
    return this.list();
  }

  static normalize(raw, idPrefix, source) {
    const id = raw && typeof raw.id === 'string' ? raw.id.trim().replace(/[^\w.-]/g, '-') : '';
    const label = raw && typeof raw.label === 'string' ? raw.label.trim().slice(0, TerminalProfileRegistry.MAX_LABEL) : '';
    if (!id || !label) return null;
    const base = { id: `${idPrefix}${id}`, label, source, env: TerminalProfileRegistry._stringMap(raw.env) };
    if (typeof raw.command === 'string' && raw.command.trim()) return { ...base, kind: 'app', command: raw.command.trim() };
    if (typeof raw.file === 'string' && raw.file.trim()) {
      const args = Array.isArray(raw.args) ? raw.args.map(String) : [];
      return { ...base, kind: 'shell', family: 'other', file: raw.file.trim(), args, login: false };
    }
    return null;
  }

  _detect() {
    if (!this._detected) this._detected = { shells: this._detectShells(), apps: this._detectApps() };
    return this._detected;
  }

  _contributedProfiles() {
    return this._contributions.all()
      .map(({ extensionId, profile }) => TerminalProfileRegistry.normalize(profile, `ext:${extensionId}:`, `extension:${extensionId}`))
      .filter(Boolean);
  }

  _customProfiles() {
    const stored = this._db.get(TerminalProfileRegistry.CUSTOM_KEY, []);
    return (Array.isArray(stored) ? stored : []).map((raw) => TerminalProfileRegistry.normalize(raw, 'custom:', 'custom')).filter(Boolean);
  }

  static _stringMap(value) {
    const out = {};
    if (!value || typeof value !== 'object') return out;
    for (const [key, entry] of Object.entries(value)) if (typeof entry === 'string') out[key] = entry;
    return out;
  }
}

module.exports = TerminalProfileRegistry;
