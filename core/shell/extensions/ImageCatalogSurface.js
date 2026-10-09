const ContextSurface = require('./ContextSurface');
const ImageCatalogRegistry = require('../../image-server/models/ImageCatalogRegistry');

class ImageCatalogSurface extends ContextSurface {
  constructor({ registry = ImageCatalogRegistry.shared } = {}) {
    super();
    this._registry = registry;
  }

  get key() {
    return 'imageCatalog';
  }

  forExtension(extensionId) {
    return {
      register: (entry) => this._registry.register(entry, extensionId),
      unregister: (id) => this._registry.unregister(id),
      list: () => this._registry.list(),
    };
  }
}

module.exports = ImageCatalogSurface;
