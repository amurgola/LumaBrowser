const axios = require('axios');
const SysdepsChecker = require('./SysdepsChecker');
const AcquisitionGuard = require('./install/AcquisitionGuard');
const ArchiveExtractor = require('./install/ArchiveExtractor');
const GithubReleaseClient = require('./install/GithubReleaseClient');
const GithubRuntimeInstall = require('./install/GithubRuntimeInstall');
const ManagedDir = require('./install/ManagedDir');
const RuntimeInstallError = require('./install/RuntimeInstallError');

class RuntimeInstaller {
  constructor({ catalog, userAgent, expectedKind, kindNoun, http = axios, sysdeps = new SysdepsChecker(), extractor = ArchiveExtractor } = {}) {
    RuntimeInstaller._assertConfigured({ catalog, userAgent, expectedKind });
    this._catalog = catalog;
    this._expectedKind = expectedKind;
    this._kindNoun = kindNoun || expectedKind;
    this._releaseClient = new GithubReleaseClient({ userAgent, http });
    this._services = { catalog, userAgent, http, extractor, sysdeps, releaseClient: this._releaseClient };
  }

  get expectedKind() {
    return this._expectedKind;
  }

  get userAgent() {
    return this._services.userAgent;
  }

  async installRuntime(id, { runtimesRoot, onEvent, isCanceled, channel } = {}) {
    const entry = AcquisitionGuard.entryFor(this._catalog, id);
    const hooks = this._extensionHooksFor(entry);
    if (hooks) return this._installThroughExtension(entry, hooks, { runtimesRoot, onEvent, isCanceled, channel });
    AcquisitionGuard.assertKind(entry, this._expectedKind, this._kindNoun);
    return new GithubRuntimeInstall(entry, { runtimesRoot, onEvent, channel }, this._services).execute();
  }

  async uninstallRuntime(id, { runtimesRoot } = {}) {
    const entry = AcquisitionGuard.entryFor(this._catalog, id);
    const hooks = this._extensionHooksFor(entry);
    if (hooks && typeof hooks.uninstall === 'function') {
      await hooks.uninstall({ entry, runtimesRoot, managedDir: ManagedDir.pathFor(runtimesRoot, entry.id) });
      return { success: true };
    }
    const removed = await ManagedDir.remove(ManagedDir.pathFor(runtimesRoot, entry.id));
    return removed ? { success: true, removed: true } : { success: true, removed: false, reason: 'Nothing to remove.' };
  }

  fetchLatestRelease(repo) {
    return this._releaseClient.latestRelease(repo);
  }

  fetchLatestPrerelease(repo) {
    return this._releaseClient.latestPrerelease(repo);
  }

  async resolvePrerelease(id) {
    const entry = AcquisitionGuard.entryFor(this._catalog, id);
    if (entry.acquisition && entry.acquisition !== 'github-release') return null;
    const assetRegex = this._catalog.getAssetPattern(entry);
    if (!assetRegex) return null;
    const found = await this._releaseClient.newestReleaseWithAsset(this._catalog.getRepo(entry), assetRegex, null);
    return found ? RuntimeInstaller._prereleaseSummary(found) : null;
  }

  _extensionHooksFor(entry) {
    if (entry.acquisition !== 'extension' || typeof this._catalog.getExtensionHooks !== 'function') return null;
    return this._catalog.getExtensionHooks(entry.id) || null;
  }

  _installThroughExtension(entry, hooks, { runtimesRoot, onEvent, isCanceled, channel }) {
    if (typeof hooks.install !== 'function') {
      throw new RuntimeInstallError(`${entry.name} declares no installer; install it through its extension.`, 'NO_EXTENSION_INSTALLER');
    }
    const managedDir = ManagedDir.pathFor(runtimesRoot, entry.id);
    return hooks.install({ entry, runtimesRoot, managedDir, onEvent, isCanceled, channel });
  }

  static _prereleaseSummary({ release, asset }) {
    return {
      tag: release.tag_name,
      name: release.name || null,
      url: release.html_url || null,
      publishedAt: release.published_at || null,
      prerelease: !!release.prerelease,
      asset: { name: asset.name, size: asset.size || null },
    };
  }

  static _assertConfigured({ catalog, userAgent, expectedKind }) {
    if (!catalog || typeof catalog.getById !== 'function') throw new Error('RuntimeInstaller requires a catalog');
    if (!userAgent) throw new Error('RuntimeInstaller requires a userAgent');
    if (!expectedKind) throw new Error('RuntimeInstaller requires an expectedKind');
  }
}

module.exports = RuntimeInstaller;
