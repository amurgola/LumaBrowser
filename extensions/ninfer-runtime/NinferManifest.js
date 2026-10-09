const fs = require('fs');
const path = require('path');

class NinferManifest {
  static FILE = 'manifest.json';

  static read(managedDir) {
    try {
      return JSON.parse(fs.readFileSync(path.join(managedDir, NinferManifest.FILE), 'utf8'));
    } catch (_) {
      return null;
    }
  }

  static write(managedDir, manifest) {
    fs.writeFileSync(path.join(managedDir, NinferManifest.FILE), JSON.stringify(manifest, null, 2));
  }
}

module.exports = NinferManifest;
