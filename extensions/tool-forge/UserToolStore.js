const JsonCollectionStore = require('../../core/database/JsonCollectionStore');

class UserToolStore extends JsonCollectionStore {
  static STORAGE_KEY = 'toolForge.tools';
  static NAME_RE = /^[a-z][a-z0-9_]{2,40}$/;

  constructor(rawDb) {
    super(rawDb, { storageKey: UserToolStore.STORAGE_KEY, entity: 'tool' });
  }

  static isValidName(name) {
    return UserToolStore.NAME_RE.test(String(name || ''));
  }

  get(idOrName) {
    if (!idOrName) return null;
    return super.get(idOrName) || this._readAll().find((tool) => tool.name === idOrName) || null;
  }

  published() {
    return this._readAll().filter((tool) => tool.status === 'published');
  }

  upsertDraft(fields) {
    const name = String(fields.name || '');
    if (!UserToolStore.isValidName(name)) {
      throw new Error(`Invalid tool name "${name}". Use 3-41 chars: a lowercase letter then letters, digits, or underscores.`);
    }
    const existing = this.get(name);
    const record = this._draftRecord(name, fields, existing);
    return existing ? this._put(existing.id, record) : this._add(record);
  }

  patch(id, changes) {
    const current = super.get(id);
    if (!current) throw new Error('Tool not found');
    return this._put(id, { ...current, ...changes, updatedAt: Date.now() });
  }

  _draftRecord(name, fields, existing) {
    const now = Date.now();
    return {
      id: existing ? existing.id : this._slugId(name),
      name,
      label: String(fields.label || existing?.label || name),
      description: String(fields.description || ''),
      inputSchema: fields.inputSchema || { type: 'object', properties: {} },
      configSlots: Array.isArray(fields.configSlots) ? fields.configSlots : [],
      allowedHosts: Array.isArray(fields.allowedHosts) ? fields.allowedHosts : [],
      code: String(fields.code || ''),
      version: existing ? (existing.version || 0) + 1 : 1,
      status: 'draft',
      lastTest: fields.lastTest !== undefined ? fields.lastTest : (existing?.lastTest || null),
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
      publishedAt: existing ? existing.publishedAt || null : null,
    };
  }
}

module.exports = UserToolStore;
