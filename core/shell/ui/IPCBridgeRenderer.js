export default class IPCBridgeRenderer {
  constructor(electronAPI) {
    this.electronAPI = electronAPI;
  }

  forExtension(extensionId) {
    const namespace = `ext.${extensionId}`;
    const api = this.electronAPI;
    const full = (channel) => `${namespace}.${channel}`;
    return {
      invoke: async (channel, ...args) => api.invoke(full(channel), ...args),
      on: (channel, callback) => api.on(full(channel), callback),
      send: (channel, ...args) => { api.send(full(channel), ...args); },
      namespace,
    };
  }
}
