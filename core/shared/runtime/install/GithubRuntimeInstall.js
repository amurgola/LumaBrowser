const path = require('path');
const BinaryLookup = require('../BinaryLookup');
const RuntimeManifest = require('../RuntimeManifest');
const AcquisitionGuard = require('./AcquisitionGuard');
const AssetDownload = require('./AssetDownload');
const CompanionAssets = require('./CompanionAssets');
const InstallEvents = require('./InstallEvents');
const ManagedDir = require('./ManagedDir');
const ReleaseAssetResolver = require('./ReleaseAssetResolver');
const RuntimeInstallError = require('./RuntimeInstallError');
const SharedLibLinker = require('./SharedLibLinker');

class GithubRuntimeInstall {
  static BINARY_SEARCH_DEPTH = 3;

  constructor(entry, { runtimesRoot, onEvent, channel } = {}, services) {
    this._entry = entry;
    this._runtimesRoot = runtimesRoot;
    this._prerelease = channel === 'prerelease';
    this._services = services;
    this._emit = InstallEvents.emitter(onEvent);
    this._managedDir = ManagedDir.pathFor(runtimesRoot, entry.id);
  }

  async execute() {
    this._assetRegex = AcquisitionGuard.assetPatternOrThrow(this._services.catalog, this._entry);
    await this._resolveReleaseAndAsset();
    await this._downloadMainAsset();
    await this._extractMainAsset();
    await this._installCompanions();
    await this._locateBinary();
    await this._linkSharedLibsOnLinux();
    await this._writeManifest();
    ManagedDir.removeQuietly(this._stagingPath);
    await this._checkSystemLibrariesOnLinux();
    return this._finish();
  }

  async _resolveReleaseAndAsset() {
    const resolver = new ReleaseAssetResolver(this._services.releaseClient);
    const repo = this._services.catalog.getRepo(this._entry);
    const { release, asset } = await resolver.resolve(repo, this._assetRegex, { prerelease: this._prerelease });
    this._release = release;
    this._asset = asset;
    this._emit('resolved', { release: InstallEvents.releaseFields(release), asset: InstallEvents.assetFields(asset) });
  }

  async _downloadMainAsset() {
    await ManagedDir.ensure(this._managedDir);
    this._stagingPath = ManagedDir.stagingPathFor(this._runtimesRoot, this._entry.id, this._asset.name);
    this._sha256 = await AssetDownload.toFile(this._asset.browser_download_url, this._stagingPath, {
      userAgent: this._services.userAgent,
      http: this._services.http,
      onProgress: (received, total) => this._emit('download', { received, total }),
    });
  }

  async _extractMainAsset() {
    this._emit('extract', { phase: 'start' });
    await ManagedDir.wipeContents(this._managedDir);
    await this._services.extractor.extract(this._stagingPath, this._managedDir);
    this._emit('extract', { phase: 'done' });
  }

  async _installCompanions() {
    const companions = new CompanionAssets(this._services);
    this._companions = await companions.install({
      specs: this._services.catalog.getCompanionAssetPatterns(this._entry),
      release: this._release,
      entry: this._entry,
      runtimesRoot: this._runtimesRoot,
      managedDir: this._managedDir,
      emit: this._emit,
    });
  }

  async _locateBinary() {
    const names = this._services.catalog.getBinaryNames(this._entry);
    this._binaryPath = await BinaryLookup.findBinaryIn(this._managedDir, names, { maxDepth: GithubRuntimeInstall.BINARY_SEARCH_DEPTH });
    if (this._binaryPath) return;
    throw new RuntimeInstallError(
      `Extraction succeeded but no expected binary was found under ${this._managedDir}.`,
      'BINARY_NOT_FOUND_AFTER_EXTRACT',
    );
  }

  async _linkSharedLibsOnLinux() {
    if (process.platform !== 'linux') return;
    await SharedLibLinker.consolidate(this._managedDir, path.dirname(this._binaryPath));
  }

  async _writeManifest() {
    this._manifest = RuntimeManifest.build({
      entry: this._entry,
      release: this._release,
      asset: this._asset,
      sha256: this._sha256,
      companions: this._companions,
      binaryPath: this._binaryPath,
      managedDir: this._managedDir,
      prerelease: this._prerelease,
    });
    await RuntimeManifest.write(this._managedDir, this._manifest);
  }

  async _checkSystemLibrariesOnLinux() {
    this._sysdeps = null;
    if (process.platform !== 'linux') return;
    try {
      this._sysdeps = await this._services.sysdeps.checkBinary(this._binaryPath);
      this._logMissingLibraries();
    } catch (err) {
      this._sysdeps = null;
      console.warn(`[runtime-installer] ${this._entry.id}: system library check failed: ${err && err.message}`);
    }
  }

  _logMissingLibraries() {
    const report = this._sysdeps;
    if (!report || report.ok) return;
    const names = report.packages.join(', ') || report.missing.map((m) => m.soname).join(', ');
    console.warn(`[runtime-installer] ${this._entry.id}: missing system libraries after install: ${names}`);
    if (report.rawLog) console.warn(`[runtime-installer] ldd output:\n${report.rawLog}`);
  }

  _finish() {
    const result = { binaryPath: this._binaryPath, manifest: this._manifest, sysdeps: this._sysdeps };
    this._emit('finalize', result);
    return { success: true, ...result };
  }
}

module.exports = GithubRuntimeInstall;
