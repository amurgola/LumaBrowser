const ContextSurface = require('./ContextSurface');
const ExtensionUrls = require('./ExtensionUrls');
const SetupTabRegistry = require('../../llm-server/chat/SetupTabRegistry');

class SetupTabSurface extends ContextSurface {
  constructor({ registry = SetupTabRegistry.shared } = {}) {
    super();
    this._registry = registry;
  }

  get key() {
    return 'setupTab';
  }

  forExtension(extensionId) {
    const uiUrl = (relPath) => ExtensionUrls.uiAsset(extensionId, relPath);
    return {
      register: (descriptor = {}) => this._registry.register(SetupTabSurface._tab(descriptor, extensionId, uiUrl), extensionId),
      unregister: (tabId) => this._registry.unregister(tabId),
      onInvoke: (fn) => this._registry.setInvokeHandler(extensionId, fn),
      uiUrl,
    };
  }

  static _tab(descriptor, extensionId, uiUrl) {
    return {
      id: descriptor.id || extensionId,
      label: descriptor.label,
      url: descriptor.url || (descriptor.file ? uiUrl(descriptor.file) : null),
    };
  }
}

module.exports = SetupTabSurface;
