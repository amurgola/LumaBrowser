const ContributionRegistry = require('../../shared/registry/ContributionRegistry');

class SetupTabRegistry extends ContributionRegistry {
  static ERROR_PREFIX = 'registerSetupTab';
  static ENTRY_NOUN = 'descriptor';

  constructor() {
    super();
    this._handlers = new Map();
  }

  setInvokeHandler(extensionId, handler) {
    if (extensionId && typeof handler === 'function') this._handlers.set(extensionId, handler);
  }

  async invoke(extensionId, action, payload) {
    const handler = this._handlers.get(extensionId);
    if (!handler) throw new Error(`setup.invoke: no handler registered for "${extensionId}"`);
    return handler(action, payload);
  }

  _toStored(descriptor, id) {
    return { label: descriptor.label || id, url: descriptor.url || null, module: descriptor.module === true };
  }

  _toListed(tab) {
    return { id: tab.id, label: tab.label, url: tab.url, module: tab.module };
  }

  _onExtensionRemoved(extensionId) {
    this._handlers.delete(extensionId);
  }

  static shared = new SetupTabRegistry();
}

module.exports = SetupTabRegistry;
