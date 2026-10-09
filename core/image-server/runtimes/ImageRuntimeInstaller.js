const RuntimeInstaller = require('../../shared/runtime/RuntimeInstaller');
const ImageRuntimeCatalog = require('./ImageRuntimeCatalog');

class ImageRuntimeInstaller extends RuntimeInstaller {
  static USER_AGENT = 'LumaBrowser-ImageServer';

  static shared = new ImageRuntimeInstaller();

  constructor({ catalog = new ImageRuntimeCatalog(), http, sysdeps, extractor } = {}) {
    super({
      catalog,
      userAgent: ImageRuntimeInstaller.USER_AGENT,
      expectedKind: 'image-inference',
      kindNoun: 'image inference',
      http,
      sysdeps,
      extractor,
    });
  }
}

module.exports = ImageRuntimeInstaller;
