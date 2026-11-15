class TerminalProfileContributions {
  static shared = new TerminalProfileContributions();

  constructor() {
    this._byExtension = new Map();
  }

  register(extensionId, profiles) {
    this._byExtension.set(extensionId, Array.isArray(profiles) ? profiles.slice() : []);
  }

  unregisterByExtension(extensionId) {
    const removed = (this._byExtension.get(extensionId) || []).length;
    this._byExtension.delete(extensionId);
    return removed;
  }

  all() {
    return [...this._byExtension].flatMap(([extensionId, profiles]) => profiles.map((profile) => ({ extensionId, profile })));
  }
}

module.exports = TerminalProfileContributions;
