class UpgradeRouter {
  constructor({ isDisabled = () => false } = {}) {
    this._handlers = new Map();
    this._isDisabled = isDisabled;
  }

  register(extensionId, suffix, handler) {
    const prefix = UpgradeRouter.prefixFor(extensionId, suffix);
    this._handlers.set(prefix, { extensionId, handler });
    return prefix;
  }

  removeExtension(extensionId) {
    for (const [prefix, entry] of this._handlers) {
      if (entry.extensionId === extensionId) this._handlers.delete(prefix);
    }
  }

  dispatch(req, socket, head) {
    try {
      const entry = this._match(UpgradeRouter._pathname(req));
      if (entry && !this._isDisabled(entry.extensionId)) {
        entry.handler(req, socket, head);
        return;
      }
    } catch (err) {
      console.error('RestGateway: upgrade handler failed:', err.message);
    }
    try { socket.destroy(); } catch (_) {}
  }

  static prefixFor(extensionId, suffix) {
    return `/api/ext/${extensionId}${suffix || ''}`;
  }

  _match(pathname) {
    for (const [prefix, entry] of this._handlers) {
      if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return entry;
    }
    return null;
  }

  static _pathname(req) {
    return String(req.url || '').split('?')[0];
  }
}

module.exports = UpgradeRouter;
