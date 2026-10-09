class McpSetupActions {
  constructor({ getService }) {
    this._getService = getService;
  }

  async invoke(action, payload = {}) {
    const service = this._readyService();
    if (!Object.hasOwn(McpSetupActions._HANDLERS, action)) throw new Error(`Unknown action: ${action}`);
    const reply = await McpSetupActions._HANDLERS[action](service, payload || {});
    return { ...reply, servers: service.rows() };
  }

  _readyService() {
    const service = this._getService();
    if (!service) throw new Error('MCP Connector not ready');
    return service;
  }

  static async _reconnect(service, payload) {
    const result = await service.reconnect(payload.id);
    if (result === null) throw new Error('Server not found');
    return { result };
  }

  static _HANDLERS = {
    list: async () => ({}),
    create: async (service, payload) => ({ server: await service.create(payload) }),
    update: async (service, payload) => ({ server: await service.update(payload.id, payload.patch) }),
    toggle: async (service, payload) => ({ server: await service.setEnabled(payload.id, payload.enabled) }),
    reconnect: (service, payload) => McpSetupActions._reconnect(service, payload),
    delete: async (service, payload) => ({ removed: await service.remove(payload.id) }),
  };
}

module.exports = McpSetupActions;
