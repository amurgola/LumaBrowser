const MediaModelCatalog = require('../../media-shared/MediaModelCatalog');
const ImageCatalogRegistry = require('./ImageCatalogRegistry');
const ImageModelEntries = require('./ImageModelEntries');

class ImageModelCatalog extends MediaModelCatalog {
  constructor({ registry = ImageCatalogRegistry.shared } = {}) {
    super(ImageModelEntries.ENTRIES);
    this._registry = registry;
  }

  list() {
    return super.list().concat(this._registry.list());
  }

  getById(id) {
    return super.getById(id) || this._registry.getById(id) || null;
  }

  static totalApproxBytes(model) {
    if (!model || !model.files) return 0;
    return Object.values(model.files).reduce((total, file) => total + ImageModelCatalog._fileBytes(file), 0);
  }

  static _fileBytes(file) {
    return file && typeof file.approxBytes === 'number' ? file.approxBytes : 0;
  }
}

module.exports = ImageModelCatalog;
