const JsonCollectionStore = require('../../core/database/JsonCollectionStore');
const McpServerConfig = require('./McpServerConfig');

class McpServerStore extends JsonCollectionStore {
  static STORAGE_KEY = 'mcpConnector.servers';

  constructor(rawDb) {
    super(rawDb, { storageKey: McpServerStore.STORAGE_KEY, entity: 'server' });
  }

  create(input = {}) {
    const config = McpServerConfig.normalize(input);
    McpServerConfig.validate(config);
    this._assertNameFree(config.name);
    const now = Date.now();
    return this._add({ id: this._slugId(config.name), ...config, createdAt: now, updatedAt: now });
  }

  update(id, patch = {}) {
    const current = this._require(id);
    const merged = McpServerConfig.normalize({ ...current, ...patch });
    this._assertNameFree(merged.name, id);
    McpServerConfig.validate(merged);
    return this._put(id, { ...current, ...merged, id, updatedAt: Date.now() });
  }

  setEnabled(id, enabled) {
    const current = this._require(id);
    return this._put(id, { ...current, enabled: !!enabled, updatedAt: Date.now() });
  }

  _require(id) {
    const current = this.get(id);
    if (!current) throw new Error('Server not found');
    return current;
  }

  _assertNameFree(name, exceptId = null) {
    if (this._nameTaken(name, exceptId)) throw new Error(`A server named "${name}" already exists`);
  }
}

module.exports = McpServerStore;
