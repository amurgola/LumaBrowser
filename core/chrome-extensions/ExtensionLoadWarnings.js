class ExtensionLoadWarnings {
  static TYPE = 'ExtensionLoadWarning';
  static COVERED = new Set([
    'contextMenus', 'webNavigation', 'notifications', 'privacy', 'sidePanel', 'cookies', 'downloads',
    'declarativeNetRequest', 'declarativeNetRequestWithHostAccess', 'declarativeNetRequestFeedback',
    'userScripts', 'nativeMessaging',
  ]);
  static UNKNOWN_PERMISSION = /^Permission '([^']+)' is unknown\.?$/;

  constructor() {
    this._reported = new Set();
  }

  static install(proc = process) {
    if (!proc || typeof proc.emitWarning !== 'function' || proc.emitWarning.__lumaExtensionFilter) return null;
    const filter = new ExtensionLoadWarnings();
    const original = proc.emitWarning;
    const wrapped = function emitWarning(warning, ...rest) {
      if (ExtensionLoadWarnings.typeOf(warning, rest[0]) !== ExtensionLoadWarnings.TYPE) return original.call(this, warning, ...rest);
      const kept = filter.filter(warning instanceof Error ? warning.message : String(warning));
      return kept === null ? undefined : original.call(this, kept, ...rest);
    };
    wrapped.__lumaExtensionFilter = true;
    proc.emitWarning = wrapped;
    return filter;
  }

  static typeOf(warning, typeOrOptions) {
    if (typeof typeOrOptions === 'string') return typeOrOptions;
    if (typeOrOptions && typeof typeOrOptions === 'object' && typeOrOptions.type) return typeOrOptions.type;
    return warning instanceof Error ? warning.name : null;
  }

  filter(message) {
    const lines = String(message).split(/\r?\n/);
    const header = lines[0];
    const details = lines.slice(1).map((line) => line.trim()).filter(Boolean).filter((line) => !this._covered(line));
    if (details.length === 0) return null;
    const key = `${header}\n${details.join('\n')}`;
    if (this._reported.has(key)) return null;
    this._reported.add(key);
    return [header, ...details.map((line) => `  ${line}`)].join('\n');
  }

  _covered(line) {
    const match = ExtensionLoadWarnings.UNKNOWN_PERMISSION.exec(line);
    return !!match && ExtensionLoadWarnings.COVERED.has(match[1]);
  }
}

module.exports = ExtensionLoadWarnings;
