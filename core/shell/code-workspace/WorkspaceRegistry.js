class WorkspaceRegistry {
  static PROJECT_KIND = 'project';

  constructor() {
    this._records = new Map();
    this._seq = 0;
  }

  add(prefix, record) {
    this._seq += 1;
    const workspaceId = `${prefix}_${this._seq}_${record.id}`;
    this._records.set(workspaceId, record);
    return workspaceId;
  }

  get(workspaceId) {
    const record = this._records.get(workspaceId);
    if (!record) throw new Error(`Unknown workspace "${workspaceId}"`);
    return record;
  }

  find(workspaceId) {
    return this._records.get(workspaceId) || null;
  }

  remove(workspaceId) {
    this._records.delete(workspaceId);
  }

  static isProject(record) {
    return record.kind === WorkspaceRegistry.PROJECT_KIND;
  }
}

module.exports = WorkspaceRegistry;
