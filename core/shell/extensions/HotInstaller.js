const fs = require('fs');
const path = require('path');
const ManifestDeps = require('./ManifestDeps');
const ManifestScanner = require('./ManifestScanner');
const ManifestValidator = require('./ManifestValidator');
const RendererBroadcast = require('./RendererBroadcast');
const RequireCacheBuster = require('./RequireCacheBuster');

class HotInstaller {
  constructor({ ledger, disabled, coreServices, activator, restGateway, disable }) {
    this._ledger = ledger;
    this._disabled = disabled;
    this._coreServices = coreServices;
    this._activator = activator;
    this._restGateway = restGateway || null;
    this._disable = disable;
  }

  async install(dir) {
    const extDir = path.resolve(dir);
    const loaded = this._loadManifest(extDir);
    if (loaded.error) return { success: false, error: loaded.error };
    const refusal = this._refusal(loaded.manifest, extDir);
    if (refusal) return { success: false, error: refusal };
    await this._replaceActiveCopy(loaded.manifest.id);
    return this._activate(loaded.manifest, extDir);
  }

  _loadManifest(extDir) {
    const manifestPath = path.resolve(extDir, ManifestScanner.MANIFEST_FILE);
    if (!fs.existsSync(manifestPath)) return { error: 'No manifest.js found in extension directory' };
    RequireCacheBuster.bust(extDir);
    try {
      return { manifest: require(manifestPath) };
    } catch (e) {
      return { error: `manifest.js failed to load: ${e.message}` };
    }
  }

  _refusal(manifest, extDir) {
    return this._validationRefusal(manifest, extDir)
      || this._shadowRefusal(manifest, extDir)
      || this._requirementRefusal(manifest);
  }

  _validationRefusal(manifest, extDir) {
    const issues = ManifestValidator.validate(manifest, extDir);
    const fatal = ManifestValidator.fatalIssues(issues);
    if (fatal.length) return fatal.join('; ');
    for (const issue of issues) console.warn(`ExtensionManager: hotInstall "${manifest.id || extDir}" - ${issue}`);
    return null;
  }

  _shadowRefusal(manifest, extDir) {
    const existing = this._ledger.manifests.get(manifest.id);
    if (existing && existing._userInstalled === false && path.resolve(existing._dir) !== extDir) {
      return `"${manifest.id}" is a built-in extension and cannot be overwritten`;
    }
    return null;
  }

  _requirementRefusal(manifest) {
    for (const depKey of Object.keys(ManifestDeps.required(manifest))) {
      if (ManifestDeps.isExt(depKey) && !this._ledger.isActive(ManifestDeps.extId(depKey))) {
        return `Requires extension "${ManifestDeps.extId(depKey)}" to be enabled first`;
      }
      if (ManifestDeps.isCore(depKey) && !ManifestDeps.coreService(this._coreServices, depKey)) {
        return `Requires core service "${depKey}" which is unavailable`;
      }
    }
    return null;
  }

  async _replaceActiveCopy(id) {
    if (this._ledger.isActive(id)) await this._disable(id);
    this._disabled.remove(id);
  }

  async _activate(manifest, extDir) {
    const id = manifest.id;
    manifest._dir = extDir;
    manifest._userInstalled = true;
    this._ledger.manifests.set(id, manifest);
    try {
      await this._activator.activate(id);
    } catch (err) {
      return { success: false, error: `activation failed: ${err.message}` };
    }
    if (this._restGateway) this._restGateway.enableExtension(id);
    this._ledger.insertIntoLoadOrder(id);
    RendererBroadcast.send(RendererBroadcast.INSTALLED, { id, name: manifest.name });
    console.log(`ExtensionManager: hot-installed "${id}" from ${extDir}`);
    return { success: true, id, name: manifest.name };
  }
}

module.exports = HotInstaller;
