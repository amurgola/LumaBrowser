const SdCppHttpAdapter = require('./SdCppHttpAdapter');
const SdCppVideoAdapter = require('./SdCppVideoAdapter');

class ImageAdapterRegistry {
  static DEFAULT_PROTOCOL = 'sd-cpp-http';

  static ADAPTERS = Object.freeze(ImageAdapterRegistry._byProtocol([SdCppHttpAdapter, SdCppVideoAdapter]));

  static createAdapterFor(runtimeEntry, opts) {
    const protocol = (runtimeEntry && runtimeEntry.protocol) || ImageAdapterRegistry.DEFAULT_PROTOCOL;
    const AdapterClass = ImageAdapterRegistry.ADAPTERS[protocol];
    if (!AdapterClass) {
      throw new Error(
        `No image adapter registered for protocol "${protocol}" (runtime ${runtimeEntry && runtimeEntry.id}).`
      );
    }
    return new AdapterClass(opts);
  }

  static listProtocols() {
    return Object.keys(ImageAdapterRegistry.ADAPTERS);
  }

  static _byProtocol(adapterClasses) {
    const map = {};
    for (const AdapterClass of adapterClasses) map[AdapterClass.protocolId] = AdapterClass;
    return map;
  }
}

module.exports = ImageAdapterRegistry;
