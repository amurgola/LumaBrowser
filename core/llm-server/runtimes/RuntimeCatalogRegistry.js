const ContributionRegistry = require('../../shared/registry/ContributionRegistry');

class RuntimeCatalogRegistry extends ContributionRegistry {
  static ERROR_PREFIX = 'llmCatalog.registerRuntime';

  static shared = new RuntimeCatalogRegistry();

  constructor() {
    super();
    this._hooks = new Map();
    this._listeners = new Set();
    this.version = 0;
  }

  register(entry, hooks = null, extensionId = null) {
    const owner = RuntimeCatalogRegistry._resolveOwner(hooks, extensionId);
    const id = this._validateEntry(entry);
    RuntimeCatalogRegistry._requireHooksObject(owner.hooks);
    const stored = this._store(entry, id, owner.extensionId);
    this._setHooks(stored.id, owner.hooks);
    this._changed();
    return stored;
  }

  hooksFor(id) {
    return this._hooks.get(id) || null;
  }

  claimedModelKinds() {
    const kinds = new Set();
    for (const entry of this._entries.values()) {
      for (const kind of entry.modelKinds || []) kinds.add(kind);
    }
    return Array.from(kinds);
  }

  runtimesForModelKind(kind) {
    return this._entryValues()
      .filter((entry) => Array.isArray(entry.modelKinds) && entry.modelKinds.includes(kind))
      .map((entry) => entry.id);
  }

  runtimesPreferringQuant(haystack) {
    const text = String(haystack || '');
    if (!text) return [];
    return this._entryValues()
      .filter((entry) => RuntimeCatalogRegistry._quantPatternMatches(entry.nativeQuantPattern, text))
      .map((entry) => entry.id);
  }

  onChange(listener) {
    if (typeof listener !== 'function') return () => {};
    this._listeners.add(listener);
    return () => { this._listeners.delete(listener); };
  }

  _validate(entry) {
    if (!entry.name) throw new Error(`${RuntimeCatalogRegistry.ERROR_PREFIX}: entry.name is required`);
  }

  _toStored(entry) {
    const stored = { kind: 'inference', acquisition: 'extension', ...entry };
    if (Array.isArray(stored.modelKinds)) {
      stored.modelKinds = stored.modelKinds.map((kind) => String(kind)).filter(Boolean);
    }
    return stored;
  }

  _onUnregistered(id) {
    this._hooks.delete(id);
  }

  _changed() {
    this.version += 1;
    for (const listener of Array.from(this._listeners)) {
      try { listener(this.version); } catch (_) {}
    }
  }

  _setHooks(id, hooks) {
    if (hooks) this._hooks.set(id, hooks);
    else this._hooks.delete(id);
  }

  _entryValues() {
    return Array.from(this._entries.values());
  }

  static _resolveOwner(hooks, extensionId) {
    if (typeof hooks === 'string') return { hooks: null, extensionId: hooks };
    return { hooks, extensionId };
  }

  static _requireHooksObject(hooks) {
    if (hooks != null && typeof hooks !== 'object') {
      throw new Error(`${RuntimeCatalogRegistry.ERROR_PREFIX}: hooks must be an object`);
    }
  }

  static _quantPatternMatches(pattern, text) {
    if (!pattern) return false;
    try {
      return new RegExp(String(pattern), 'i').test(text);
    } catch (_) {
      return false;
    }
  }
}

module.exports = RuntimeCatalogRegistry;
