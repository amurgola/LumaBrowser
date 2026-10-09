const ManifestDeps = require('./ManifestDeps');
const LlmRuntimesView = require('./LlmRuntimesView');
const ChatModeRegistry = require('../../llm-server/chat/ChatModeRegistry');
const SetupTabRegistry = require('../../llm-server/chat/SetupTabRegistry');
const ImageCatalogRegistry = require('../../image-server/models/ImageCatalogRegistry');
const RuntimeCatalogRegistry = require('../../llm-server/runtimes/RuntimeCatalogRegistry');
const ModelCatalogRegistry = require('../../llm-server/models/ModelCatalogRegistry');
const TtsEngineRegistry = require('../../tts-server/TtsEngineRegistry');

class ExtensionTeardown {
  static sharedRegistries() {
    return {
      chatModes: ChatModeRegistry.shared,
      setupTabs: SetupTabRegistry.shared,
      imageCatalog: ImageCatalogRegistry.shared,
      runtimeCatalog: RuntimeCatalogRegistry.shared,
      modelCatalog: ModelCatalogRegistry.shared,
      ttsEngines: TtsEngineRegistry.shared,
    };
  }

  constructor({ coreServices, ipcBridge, mcpAggregator, restGateway, registries = ExtensionTeardown.sharedRegistries() }) {
    this._coreServices = coreServices;
    this._ipcBridge = ipcBridge || null;
    this._mcpAggregator = mcpAggregator || null;
    this._restGateway = restGateway || null;
    this._registries = registries;
  }

  async teardown(id, ext) {
    await ExtensionTeardown.runDeactivate(id, ext.instance);
    this._unregisterLlmSlots(id, ext.manifest);
    this._removeChannels(id);
    this._unregisterContributions(id);
    this._disableRoutes(id);
  }

  static async runDeactivate(id, instance) {
    if (!instance || typeof instance.deactivate !== 'function') return false;
    try {
      await instance.deactivate();
      return true;
    } catch (err) {
      console.error(`ExtensionManager: error deactivating "${id}":`, err.message);
      return false;
    }
  }

  _unregisterLlmSlots(id, manifest) {
    const llm = this._coreServices.llm;
    if (!llm) return;
    for (const slot of ManifestDeps.llmSlots(manifest)) llm.unregisterSlot(`${id}.${slot.id}`);
  }

  _removeChannels(id) {
    if (this._ipcBridge) this._ipcBridge.removeAllForExtension(id);
    if (this._mcpAggregator) this._mcpAggregator.unregisterExtension(id);
  }

  _unregisterContributions(id) {
    const r = this._registries;
    r.chatModes.unregisterByExtension(id);
    r.setupTabs.unregisterByExtension(id);
    r.imageCatalog.unregisterByExtension(id);
    r.modelCatalog.unregisterByExtension(id);
    if (r.runtimeCatalog.unregisterByExtension(id) > 0) LlmRuntimesView.invalidate(this._coreServices);
    r.ttsEngines.unregisterByExtension(id);
  }

  _disableRoutes(id) {
    if (!this._restGateway) return;
    this._restGateway.disableExtension(id);
    if (typeof this._restGateway.removeExtensionUpgrades === 'function') this._restGateway.removeExtensionUpgrades(id);
  }
}

module.exports = ExtensionTeardown;
