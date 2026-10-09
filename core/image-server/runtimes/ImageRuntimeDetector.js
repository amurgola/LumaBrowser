const RuntimeDetector = require('../../shared/runtime/RuntimeDetector');
const ImageRuntimeCatalog = require('./ImageRuntimeCatalog');

class ImageRuntimeDetector extends RuntimeDetector {
  static DEFAULT_PROTOCOL = 'sd-cpp-http';

  static shared = new ImageRuntimeDetector();

  constructor(catalog = new ImageRuntimeCatalog()) {
    super({ catalog, expectedKind: 'image-inference' });
  }

  parseVersionOutput(stdout, stderr) {
    const firstLine = `${stdout}\n${stderr}`.trim().split(/\r?\n/)[0];
    return firstLine || null;
  }

  _decorateDetail(detail, entry) {
    detail.protocol = entry.protocol || ImageRuntimeDetector.DEFAULT_PROTOCOL;
  }
}

module.exports = ImageRuntimeDetector;
