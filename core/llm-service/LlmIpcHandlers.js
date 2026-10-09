const { ipcMain } = require('electron');
const IpcEnvelope = require('../shared/ipc/IpcEnvelope');
const ProviderConfigService = require('./ProviderConfigService');
const LlmQueueEventForwarder = require('./LlmQueueEventForwarder');

class LlmIpcHandlers {
  constructor({ db, lmStudioService, anthropicService, llmService, getMainWindow }) {
    this._lmStudio = lmStudioService;
    this._anthropic = anthropicService;
    this._llm = llmService;
    this._getMainWindow = getMainWindow;
    this._configs = new ProviderConfigService({ db, lmStudioService, anthropicService });
  }

  register() {
    this._registerDefaultProvider();
    this._registerProvider('lmstudio', this._lmStudio);
    this._registerProvider('anthropic', this._anthropic);
    this._registerSlots();
    this._registerQueue();
    LlmQueueEventForwarder.attach(this._llm.getQueueManager(), this._getMainWindow);
  }

  _registerDefaultProvider() {
    ipcMain.handle('save-llm-provider-config', IpcEnvelope.enveloped((_e, config) => this._configs.setDefaultProvider(config.provider)));
    ipcMain.handle('get-llm-provider-config', IpcEnvelope.raw(() => ({ provider: this._configs.getDefaultProvider() })));
  }

  _registerProvider(name, provider) {
    ipcMain.handle(`save-${name}-config`, IpcEnvelope.enveloped((_e, config) => ProviderConfigService.applyProviderSettings(provider, config)));
    ipcMain.handle(`get-${name}-config`, IpcEnvelope.raw(() => provider.getConfig()));
    ipcMain.handle(`fetch-${name}-models`, IpcEnvelope.enveloped((_e, endpoint) => this._configs.probeModels(provider, endpoint)));
    ipcMain.handle(`test-${name}-connection`, IpcEnvelope.enveloped(() => provider.testConnection()));
  }

  _registerSlots() {
    ipcMain.handle('core.llm.getAllSlots', IpcEnvelope.raw(() => this._llm.getAllSlots()));
    ipcMain.handle('core.llm.getSlotConfig', IpcEnvelope.raw((_e, slotId) => this._llm.getSlotConfig(slotId)));
    ipcMain.handle('core.llm.setSlotConfig', IpcEnvelope.enveloped((_e, slotId, provider, model) => { this._llm.setSlotConfig(slotId, provider, model); }));
    ipcMain.handle('core.llm.clearSlotConfig', IpcEnvelope.enveloped((_e, slotId) => { this._llm.clearSlotConfig(slotId); }));
    ipcMain.handle('core.llm.getAllAvailableModels', IpcEnvelope.raw(() => this._llm.getAllAvailableModels()));
    ipcMain.handle('core.llm.getProviders', IpcEnvelope.raw(() => this._llm.getProviders()));
    ipcMain.handle('core.llm.sendCompletion', IpcEnvelope.enveloped((_e, slotId, messages, options) => this._llm.sendCompletion(slotId, messages, options)));
  }

  _registerQueue() {
    ipcMain.handle('core.llm.queue.getSnapshot', IpcEnvelope.raw(() => {
      const queue = this._llm.getQueueManager();
      return queue ? queue.getSnapshot() : [];
    }));
    ipcMain.handle('core.llm.queue.setConcurrency', IpcEnvelope.enveloped((_e, modelId, maxConcurrency) => {
      const queue = this._llm.getQueueManager();
      if (!queue) return { success: false, error: 'Queue manager not initialized' };
      queue.setConcurrency(modelId, maxConcurrency);
      return null;
    }));
  }
}

module.exports = LlmIpcHandlers;
