const ContributionRegistry = require('../../shared/registry/ContributionRegistry');

class ModelCatalogRegistry extends ContributionRegistry {
  static ERROR_PREFIX = 'llmCatalog.registerModel';

  static shared = new ModelCatalogRegistry();

  _validate(entry) {
    const file = entry.file;
    if (!file || !file.url || !file.filename) {
      throw new Error(`${ModelCatalogRegistry.ERROR_PREFIX}: entry.file {url, filename} is required`);
    }
  }
}

module.exports = ModelCatalogRegistry;
