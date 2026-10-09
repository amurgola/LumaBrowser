const { ipcMain } = require('electron');

class LocalApiIpcHandlers {
  static CHANNEL_GET_CONFIG = 'core.llmServer.localApi.getConfig';
  static CHANNEL_SET_ENABLED = 'core.llmServer.localApi.setEnabled';
  static CHANNEL_SET_PORT = 'core.llmServer.localApi.setPort';

  static register(localApiServer) {
    ipcMain.handle(LocalApiIpcHandlers.CHANNEL_GET_CONFIG, () => localApiServer.getConfig());
    ipcMain.handle(LocalApiIpcHandlers.CHANNEL_SET_ENABLED, async (_event, enabled) =>
      LocalApiIpcHandlers._withConfig(localApiServer, await localApiServer.setEnabled(enabled)));
    ipcMain.handle(LocalApiIpcHandlers.CHANNEL_SET_PORT, async (_event, port) =>
      LocalApiIpcHandlers._withConfig(localApiServer, await localApiServer.setPort(port)));
  }

  static _withConfig(localApiServer, result) {
    return { ...result, config: localApiServer.getConfig() };
  }
}

module.exports = LocalApiIpcHandlers;
