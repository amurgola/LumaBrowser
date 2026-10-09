const ContextSurface = require('./ContextSurface');
const LlmRuntimesView = require('./LlmRuntimesView');
const RuntimeCatalogRegistry = require('../../llm-server/runtimes/RuntimeCatalogRegistry');
const ModelCatalogRegistry = require('../../llm-server/models/ModelCatalogRegistry');

class LlmCatalogSurface extends ContextSurface {
  constructor({ runtimes = RuntimeCatalogRegistry.shared, models = ModelCatalogRegistry.shared, coreServices = {} } = {}) {
    super();
    this._runtimes = runtimes;
    this._models = models;
    this._coreServices = coreServices;
  }

  get key() {
    return 'llmCatalog';
  }

  forExtension(extensionId) {
    return {
      registerRuntime: (entry, hooks) => this._registerRuntime(entry, hooks, extensionId),
      unregisterRuntime: (id) => this._unregisterRuntime(id),
      listRuntimes: () => this._runtimes.list(),
      registerModel: (entry) => this._models.register(entry, extensionId),
      unregisterModel: (id) => this._models.unregister(id),
      listModels: () => this._models.list(),
    };
  }

  _registerRuntime(entry, hooks, extensionId) {
    const stored = this._runtimes.register(entry, hooks || null, extensionId);
    LlmRuntimesView.invalidate(this._coreServices);
    return stored;
  }

  _unregisterRuntime(id) {
    const removed = this._runtimes.unregister(id);
    if (removed) LlmRuntimesView.invalidate(this._coreServices);
    return removed;
  }
}

module.exports = LlmCatalogSurface;
