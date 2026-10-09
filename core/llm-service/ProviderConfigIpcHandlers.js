const { ipcMain } = require('electron');
const IpcEnvelope = require('../shared/ipc/IpcEnvelope');
const ProviderConfigService = require('./ProviderConfigService');

class ProviderConfigIpcHandlers {
  constructor({ db, lmStudioService, anthropicService, llmServerService = null }) {
    this._configs = new ProviderConfigService({ db, lmStudioService, anthropicService, llmServerService });
  }

  register() {
    ipcMain.handle('core.llm.getProviderConfigs', IpcEnvelope.raw(() => this._configs.listProviderConfigs()));
    ipcMain.handle('core.llm.saveProviderConfigs', IpcEnvelope.enveloped((_e, configs) => { this._configs.saveProviderConfigs(configs); }));
    ipcMain.handle('core.llm.fetchModelsForEndpoint', IpcEnvelope.enveloped((_e, type, endpoint, apiKey) => (
      this._configs.probeModelsForType(type, endpoint, apiKey)
    )));
  }
}

module.exports = ProviderConfigIpcHandlers;
