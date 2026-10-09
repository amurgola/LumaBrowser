class McpServerService {
  constructor({ store, manager }) {
    this.store = store;
    this._manager = manager;
  }

  rows() {
    const live = new Map(this._manager.status().map((row) => [row.id, row]));
    return this.store.list().map((config) => McpServerService._row(config, live.get(config.id) || {}));
  }

  get(id) {
    return this.store.get(id);
  }

  async create(input) {
    const server = this.store.create(input || {});
    if (server.enabled !== false) await this._manager.connect(server);
    return server;
  }

  async update(id, patch) {
    const server = this.store.update(id, patch || {});
    await this._applyEnabled(server);
    return server;
  }

  async setEnabled(id, enabled) {
    const server = this.store.setEnabled(id, !!enabled);
    await this._applyEnabled(server);
    return server;
  }

  async reconnect(id) {
    const config = this.store.get(id);
    if (!config) return null;
    return this._manager.connect(config);
  }

  async remove(id) {
    await this._manager.disconnect(id);
    return this.store.delete(id);
  }

  async _applyEnabled(server) {
    if (server.enabled !== false) await this._manager.connect(server);
    else await this._manager.disconnect(server.id);
  }

  static _row(config, live) {
    return {
      id: config.id,
      name: config.name,
      transport: config.transport,
      enabled: config.enabled !== false,
      command: config.command || '',
      args: config.args || [],
      env: config.env || {},
      cwd: config.cwd || '',
      url: config.url || '',
      headers: config.headers || {},
      status: live.status || (config.enabled === false ? 'disabled' : 'idle'),
      error: live.error || null,
      tools: live.tools || [],
    };
  }
}

module.exports = McpServerService;
