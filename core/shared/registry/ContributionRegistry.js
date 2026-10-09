class ContributionRegistry {
  static ERROR_PREFIX = 'register';
  static ENTRY_NOUN = 'entry';

  constructor() {
    this._entries = new Map();
    this._byExtension = new Map();
  }

  register(entry, extensionId = null) {
    const id = this._validateEntry(entry);
    const stored = this._store(entry, id, extensionId);
    this._changed();
    return stored;
  }

  unregister(id) {
    const entry = this._entries.get(id);
    if (!entry) return false;
    this._entries.delete(id);
    this._forgetOwner(id, entry._extensionId);
    this._onUnregistered(id);
    this._changed();
    return true;
  }

  unregisterByExtension(extensionId) {
    const ids = Array.from(this._byExtension.get(extensionId) || []);
    const removed = ids.filter((id) => this.unregister(id)).length;
    this._byExtension.delete(extensionId);
    this._onExtensionRemoved(extensionId);
    return removed;
  }

  get(id) {
    return this._entries.get(id) || null;
  }

  getById(id) {
    const entry = this._entries.get(id);
    return entry ? this._toListed(entry) : null;
  }

  has(id) {
    return this._entries.has(id);
  }

  list() {
    return Array.from(this._entries.values()).map((entry) => this._toListed(entry));
  }

  extensions() {
    return Array.from(this._byExtension.keys());
  }

  _validate(_entry, _id) {}

  _toStored(entry, _id) {
    return { ...entry };
  }

  _toListed({ _extensionId, ...entry }) {
    return entry;
  }

  _onUnregistered(_id) {}

  _onExtensionRemoved(_extensionId) {}

  _changed() {}

  _validateEntry(entry) {
    const { ERROR_PREFIX: prefix, ENTRY_NOUN: noun } = this.constructor;
    if (!entry || typeof entry !== 'object') throw new Error(`${prefix}: ${noun} object is required`);
    const id = entry.id ? String(entry.id).trim() : '';
    if (!id) throw new Error(`${prefix}: ${noun}.id is required`);
    this._validate(entry, id);
    return id;
  }

  _store(entry, id, extensionId) {
    this._releasePreviousOwner(id);
    const stored = { ...this._toStored(entry, id), id, _extensionId: extensionId || null };
    this._entries.set(id, stored);
    this._indexOwner(id, stored._extensionId);
    return stored;
  }

  _releasePreviousOwner(id) {
    const previous = this._entries.get(id);
    if (previous) this._forgetOwner(id, previous._extensionId);
  }

  _indexOwner(id, extensionId) {
    if (!extensionId) return;
    if (!this._byExtension.has(extensionId)) this._byExtension.set(extensionId, new Set());
    this._byExtension.get(extensionId).add(id);
  }

  _forgetOwner(id, extensionId) {
    const ids = extensionId && this._byExtension.get(extensionId);
    if (!ids) return;
    ids.delete(id);
    if (ids.size === 0) this._byExtension.delete(extensionId);
  }
}

module.exports = ContributionRegistry;
