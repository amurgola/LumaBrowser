class ExtensionRouteTable {
  constructor() {
    this._routes = new Map();
    this._disabled = new Set();
  }

  static defaultPrefix(extensionId) {
    return `/api/ext/${extensionId}`;
  }

  record(extensionId, router, prefix) {
    this._routes.set(extensionId, { router, prefix });
  }

  prefixOf(extensionId) {
    const entry = this._routes.get(extensionId);
    return entry ? entry.prefix : ExtensionRouteTable.defaultPrefix(extensionId);
  }

  extensionIds() {
    return [...this._routes.keys()];
  }

  prefixes() {
    return [...this._routes].map(([id, { prefix }]) => ({ id, prefix }));
  }

  disable(extensionId) {
    this._disabled.add(extensionId);
  }

  enable(extensionId) {
    this._disabled.delete(extensionId);
  }

  isDisabled(extensionId) {
    return this._disabled.has(extensionId);
  }

  gate(extensionId, router) {
    return (req, res, next) => {
      if (this.isDisabled(extensionId)) {
        res.status(503).json({ error: 'Extension disabled', extensionId });
        return;
      }
      router(req, res, next);
    };
  }
}

module.exports = ExtensionRouteTable;
