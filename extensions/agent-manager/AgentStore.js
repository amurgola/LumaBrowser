const JsonCollectionStore = require('../../core/database/JsonCollectionStore');

class AgentStore extends JsonCollectionStore {
  static STORAGE_KEY = 'agentManager.agents';

  constructor(rawDb) {
    super(rawDb, { storageKey: AgentStore.STORAGE_KEY, entity: 'agent' });
  }

  get(idOrName) {
    if (!idOrName) return null;
    const byId = super.get(idOrName);
    if (byId) return byId;
    const key = String(idOrName).trim().toLowerCase();
    return this._readAll().find((a) => (a.name || '').trim().toLowerCase() === key) || null;
  }

  create(input = {}) {
    const name = String(input.name || '').trim();
    if (!name) throw new Error('Agent name is required');
    if (this._nameTaken(name)) throw new Error(`An agent named "${name}" already exists`);
    const now = Date.now();
    return this._add({
      id: this._slugId(name),
      name,
      description: String(input.description || '').trim(),
      systemPrompt: String(input.systemPrompt || '').trim(),
      tools: AgentStore._toolNames(input.tools),
      modelRef: input.modelRef ? String(input.modelRef) : null,
      createdAt: now,
      updatedAt: now,
    });
  }

  update(id, patch = {}) {
    const current = { ...(super.get(id) || {}) };
    if (!current.id) throw new Error('Agent not found');
    if (patch.name != null) current.name = this._renamed(id, patch.name);
    if (patch.description != null) current.description = String(patch.description).trim();
    if (patch.systemPrompt != null) current.systemPrompt = String(patch.systemPrompt).trim();
    if (patch.tools != null) current.tools = AgentStore._toolNames(patch.tools);
    if ('modelRef' in patch) current.modelRef = patch.modelRef ? String(patch.modelRef) : null;
    current.updatedAt = Date.now();
    return this._put(id, current);
  }

  _renamed(id, rawName) {
    const name = String(rawName).trim();
    if (!name) throw new Error('Agent name cannot be empty');
    if (this._nameTaken(name, id)) throw new Error(`An agent named "${name}" already exists`);
    return name;
  }

  static _toolNames(tools) {
    return Array.isArray(tools) ? tools.filter((t) => typeof t === 'string') : [];
  }
}

module.exports = AgentStore;
