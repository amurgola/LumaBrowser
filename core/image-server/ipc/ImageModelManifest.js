const fs = require('fs');
const path = require('path');
const ContainedPath = require('../../shared/fs/ContainedPath');

class ImageModelManifest {
  static FILE = 'manifest.json';

  static pathIn(dir) {
    return path.join(dir, ImageModelManifest.FILE);
  }

  static exists(dir) {
    return fs.existsSync(ImageModelManifest.pathIn(dir));
  }

  static read(dir) {
    return JSON.parse(fs.readFileSync(ImageModelManifest.pathIn(dir), 'utf8'));
  }

  static readOrEmpty(dir) {
    try {
      return ImageModelManifest.read(dir);
    } catch (_) {
      return {};
    }
  }

  static write(dir, manifest) {
    fs.writeFileSync(ImageModelManifest.pathIn(dir), JSON.stringify(manifest, null, 2), 'utf8');
  }

  static writeQuietly(dir, manifest, label = 'manifest') {
    try {
      ImageModelManifest.write(dir, manifest);
    } catch (err) {
      console.warn(`[image-server] ${label} write failed:`, err && err.message);
    }
  }

  static filesBag(files) {
    const out = {};
    for (const role of Object.keys(files || {})) {
      const src = files[role];
      out[role] = { file: src.file, ...(src.loaderFlag ? { loaderFlag: src.loaderFlag } : {}) };
    }
    return out;
  }

  static modelDir(modelsDir, id) {
    if (!id || typeof id !== 'string') return null;
    const dir = path.join(modelsDir, id);
    return ContainedPath.isImmediateChild(modelsDir, dir) ? dir : null;
  }
}

module.exports = ImageModelManifest;
