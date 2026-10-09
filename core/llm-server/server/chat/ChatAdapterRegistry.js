const OpenAICompatAdapter = require('./OpenAICompatAdapter');

class ChatAdapterRegistry {
  static DEFAULT_PROTOCOL = 'openai-compat';

  static ADAPTERS = Object.freeze(ChatAdapterRegistry._byProtocol([OpenAICompatAdapter]));

  static createAdapterFor(runtimeEntry, opts) {
    const AdapterClass = ChatAdapterRegistry._adapterClassFor(runtimeEntry);
    const request = (opts && opts.request) || ChatAdapterRegistry._entryRequest(runtimeEntry);
    return new AdapterClass({ ...opts, request });
  }

  static listProtocols() {
    return Object.keys(ChatAdapterRegistry.ADAPTERS);
  }

  static _adapterClassFor(runtimeEntry) {
    const protocol = (runtimeEntry && runtimeEntry.protocol) || ChatAdapterRegistry.DEFAULT_PROTOCOL;
    const AdapterClass = ChatAdapterRegistry.ADAPTERS[protocol];
    if (!AdapterClass) {
      throw new Error(
        `No chat adapter registered for protocol "${protocol}" (runtime ${runtimeEntry && runtimeEntry.id}).`
      );
    }
    return AdapterClass;
  }

  static _entryRequest(runtimeEntry) {
    const request = runtimeEntry && runtimeEntry.request;
    return request && typeof request === 'object' ? request : null;
  }

  static _byProtocol(adapterClasses) {
    const map = {};
    for (const AdapterClass of adapterClasses) map[AdapterClass.protocolId] = AdapterClass;
    return map;
  }
}

module.exports = ChatAdapterRegistry;
