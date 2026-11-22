const fs = require('fs');
const path = require('path');
const BasaltCudaRuntime = require('./BasaltCudaRuntime');
const BasaltLayout = require('./BasaltLayout');
const CoreRequire = require('./CoreRequire');

const RuntimeManifest = CoreRequire.load('shared/runtime/RuntimeManifest');

class BasaltDetector {
  static async detect({ entry, managedDir }, platform = process.platform) {
    const manifest = await RuntimeManifest.read(managedDir);
    if (!manifest || !entry || manifest.id !== entry.id || !manifest.binary) return { installed: false };
    const layout = new BasaltLayout(path.join(managedDir, manifest.binary), platform);
    const missing = BasaltDetector._missingParts(layout, platform);
    if (missing.length > 0) return { installed: false, manifest, error: `Basalt install is incomplete (missing ${missing.join(', ')}); install it again.` };
    return {
      installed: true,
      source: 'managed',
      binaryPath: layout.binaryPath,
      version: (manifest.release && manifest.release.tag) || null,
      manifest,
    };
  }

  static _missingParts(layout, platform) {
    const missing = [];
    if (!fs.existsSync(layout.binaryPath)) missing.push(layout.binaryPath);
    if (!fs.existsSync(layout.venvPython)) missing.push('the server venv');
    if (BasaltCudaRuntime.missingIn(layout.binDir, platform).length > 0) missing.push('the CUDA 13 libraries');
    return missing;
  }
}

module.exports = BasaltDetector;
