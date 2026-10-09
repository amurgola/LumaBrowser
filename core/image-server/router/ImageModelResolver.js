const path = require('path');
const ImageModelsScanner = require('../ImageModelsScanner');

class ImageModelResolver {
  static LOCAL_PREFIX = 'local::';

  constructor({ imageServerService, scanner = new ImageModelsScanner() }) {
    this._svc = imageServerService;
    this._scanner = scanner;
  }

  static stripLocal(ref) {
    if (typeof ref !== 'string') return null;
    return ref.startsWith(ImageModelResolver.LOCAL_PREFIX) ? ref.slice(ImageModelResolver.LOCAL_PREFIX.length) : ref;
  }

  static idFor(modelRef, fallbackId) {
    return (modelRef && ImageModelResolver.stripLocal(modelRef)) || fallbackId || null;
  }

  async resolve(id) {
    const scan = await this._scanner.scan(this._modelsDir());
    return (scan.models || []).find((model) => model.id === id) || null;
  }

  lorasDir() {
    try {
      return path.join(this._modelsDir(), 'loras');
    } catch (_) {
      return null;
    }
  }

  _modelsDir() {
    return this._svc.getModelsDirConfig().effectivePath;
  }
}

module.exports = ImageModelResolver;
