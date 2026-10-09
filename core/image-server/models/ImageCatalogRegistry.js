const ContributionRegistry = require('../../shared/registry/ContributionRegistry');

class ImageCatalogRegistry extends ContributionRegistry {
  static ERROR_PREFIX = 'imageCatalog.register';

  static shared = new ImageCatalogRegistry();
}

module.exports = ImageCatalogRegistry;
