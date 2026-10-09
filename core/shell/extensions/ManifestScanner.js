const fs = require('fs');
const path = require('path');
const ManifestValidator = require('./ManifestValidator');

class ManifestScanner {
  static MANIFEST_FILE = 'manifest.js';

  constructor({ roots, skipDebugOnly = false, onError = () => {} }) {
    this._roots = roots;
    this._skipDebugOnly = skipDebugOnly;
    this._onError = onError;
  }

  scan() {
    const manifests = new Map();
    for (const root of this._roots) {
      for (const entry of this._extensionDirs(root.dir)) this._consider(manifests, entry, root.userInstalled);
    }
    console.log(`ExtensionManager: ${manifests.size} extension(s) discovered`);
    return manifests;
  }

  _extensionDirs(baseDir) {
    if (!baseDir || !fs.existsSync(baseDir)) return [];
    return fs.readdirSync(baseDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({ name: entry.name, dir: path.resolve(baseDir, entry.name) }))
      .filter((entry) => fs.existsSync(path.resolve(entry.dir, ManifestScanner.MANIFEST_FILE)));
  }

  _consider(manifests, entry, userInstalled) {
    const manifestPath = path.resolve(entry.dir, ManifestScanner.MANIFEST_FILE);
    try {
      const manifest = require(manifestPath);
      if (!this._passesValidation(manifest, entry)) return;
      if (this._isSkippedDebugOnly(manifest)) return;
      if (this._isShadowing(manifests, manifest, entry.dir, userInstalled)) return;
      this._record(manifests, manifest, entry.dir, userInstalled);
    } catch (err) {
      console.error(`ExtensionManager: failed to load manifest from ${manifestPath}:`, err.message);
      this._onError(entry.name, 'discovery', err.message);
    }
  }

  _passesValidation(manifest, entry) {
    const issues = ManifestValidator.validate(manifest, entry.dir);
    for (const issue of issues) {
      console.warn(`ExtensionManager: ${entry.name} - ${issue}`);
      this._onError(entry.name, 'validation', issue);
    }
    return ManifestValidator.fatalIssues(issues).length === 0;
  }

  _isSkippedDebugOnly(manifest) {
    if (!manifest.debugOnly || !this._skipDebugOnly) return false;
    console.log(`ExtensionManager: skipping debug-only extension "${manifest.id}"`);
    return true;
  }

  _isShadowing(manifests, manifest, extDir, userInstalled) {
    if (!manifests.has(manifest.id)) return false;
    console.warn(`ExtensionManager: ignoring ${userInstalled ? 'sideloaded ' : ''}"${manifest.id}" at ${extDir}: id already discovered`);
    return true;
  }

  _record(manifests, manifest, extDir, userInstalled) {
    manifest._dir = extDir;
    manifest._userInstalled = userInstalled;
    manifests.set(manifest.id, manifest);
    console.log(`ExtensionManager: discovered ${userInstalled ? 'sideloaded ' : ''}extension "${manifest.id}" (${manifest.name} v${manifest.version || '?'})`);
  }
}

module.exports = ManifestScanner;
