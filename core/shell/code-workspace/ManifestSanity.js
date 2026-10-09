const fs = require('fs');
const path = require('path');

class ManifestSanity {
  static MANIFEST_FILE = 'manifest.js';
  static SURFACES = ['main', 'renderer', 'routes', 'mcpTools', 'chatModes', 'chatUi', 'setupTab'];

  static check(dir, workspaceId) {
    const loaded = ManifestSanity._load(path.join(dir, ManifestSanity.MANIFEST_FILE));
    if (loaded.error) return { ok: false, errors: [loaded.error], manifest: null };
    const errors = [
      ...ManifestSanity._identityErrors(loaded.manifest, workspaceId),
      ...ManifestSanity._missingSurfaceErrors(loaded.manifest, dir),
    ];
    return { ok: errors.length === 0, errors, manifest: loaded.manifest };
  }

  static _load(manifestPath) {
    if (!fs.existsSync(manifestPath)) return { error: 'manifest.js is missing' };
    let manifest;
    try {
      delete require.cache[require.resolve(manifestPath)];
      manifest = require(manifestPath);
    } catch (err) {
      return { error: `manifest.js failed to load: ${(err && err.message) || err}` };
    }
    if (!manifest || typeof manifest !== 'object') return { error: 'manifest.js must export an object' };
    return { manifest };
  }

  static _identityErrors(manifest, workspaceId) {
    const errors = [];
    if (!manifest.id) errors.push('manifest is missing "id"');
    else if (manifest.id !== workspaceId) errors.push(`manifest id "${manifest.id}" must equal the workspace id "${workspaceId}"`);
    if (!manifest.name) errors.push('manifest is missing "name"');
    return errors;
  }

  static _missingSurfaceErrors(manifest, dir) {
    const errors = [];
    for (const field of ManifestSanity.SURFACES) {
      const rel = ManifestSanity._fileOf(manifest[field]);
      if (!rel) continue;
      const abs = path.join(dir, String(rel).replace(/^\.\//, ''));
      if (!fs.existsSync(abs)) errors.push(`manifest.${field} → "${rel}" does not exist`);
    }
    return errors;
  }

  static _fileOf(declared) {
    return typeof declared === 'string' ? declared : (declared && declared.file);
  }
}

module.exports = ManifestSanity;
