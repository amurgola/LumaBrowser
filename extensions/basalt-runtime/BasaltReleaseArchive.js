const path = require('path');
const BasaltCatalog = require('./BasaltCatalog');
const CoreRequire = require('./CoreRequire');

const ArchiveExtractor = CoreRequire.load('shared/runtime/install/ArchiveExtractor');
const BinaryLookup = CoreRequire.load('shared/runtime/BinaryLookup');
const ManagedDir = CoreRequire.load('shared/runtime/install/ManagedDir');
const ResumableDownload = CoreRequire.load('shared/download/ResumableDownload');
const RuntimeInstallError = CoreRequire.load('shared/runtime/install/RuntimeInstallError');

class BasaltReleaseArchive {
  static DOWNLOAD_LABEL = 'Basalt runtime';
  static BINARY_SEARCH_DEPTH = 3;
  static IN_USE_FILES_SHOWN = 4;

  constructor({ build, runtimesRoot, managedDir, emit, canceled, platformKey, download = ResumableDownload, extractor = ArchiveExtractor }) {
    this._build = build;
    this._runtimesRoot = runtimesRoot;
    this._managedDir = managedDir;
    this._emit = emit;
    this._canceled = canceled;
    this._asset = BasaltCatalog.assetFor(build, platformKey);
    this._download = download;
    this._extractor = extractor;
  }

  async install() {
    if (!this._asset) throw new RuntimeInstallError(`${this._build.name} publishes no release archive for ${process.platform}-${process.arch}.`, 'ASSET_NOT_FOUND');
    const archivePath = await this._downloadArchive();
    await this._unpack(archivePath);
    ManagedDir.removeQuietly(archivePath);
    return { binaryPath: await this._locateBinary(), asset: this._asset };
  }

  async _downloadArchive() {
    const { url, name, bytes, sha256 } = this._asset;
    this._emit('resolved', { release: { tagName: this._build.release.tag, url: BasaltCatalog.releaseUrl(this._build) }, asset: { name, size: bytes, url } });
    const stagingPath = ManagedDir.stagingPathFor(this._runtimesRoot, this._build.runtimeId, name);
    const result = await this._download.download({
      url,
      destPath: stagingPath,
      controller: new AbortController(),
      isCanceled: this._canceled,
      label: BasaltReleaseArchive.DOWNLOAD_LABEL,
      expectedSize: bytes,
      expectedSha256: sha256,
      onProgress: (received, total, stats) => this._emit('download', { received, total, bytesPerSec: stats && stats.bytesPerSec, etaMs: stats && stats.etaMs }),
    });
    if (result && result.canceled) throw new RuntimeInstallError('Install canceled.', 'CANCELED');
    return stagingPath;
  }

  async _unpack(archivePath) {
    this._emit('extract', { phase: 'start' });
    await ManagedDir.ensure(this._managedDir);
    const leftovers = await ManagedDir.wipeContents(this._managedDir);
    if (leftovers.length > 0) throw this._inUse(leftovers);
    await this._extractor.extract(archivePath, this._managedDir);
  }

  _inUse(leftovers) {
    const shown = leftovers.slice(0, BasaltReleaseArchive.IN_USE_FILES_SHOWN).join(', ');
    return new RuntimeInstallError(
      `Basalt is still in use: ${shown} in ${this._managedDir} could not be replaced. Stop the model server running Basalt and try again.`,
      'RUNTIME_IN_USE',
      { managedDir: this._managedDir, files: leftovers },
    );
  }

  async _locateBinary() {
    const names = BasaltCatalog.BINARY_NAMES[process.platform] || BasaltCatalog.BINARY_NAMES.linux;
    const found = await BinaryLookup.findBinaryIn(this._managedDir, names, { maxDepth: BasaltReleaseArchive.BINARY_SEARCH_DEPTH });
    if (found && path.basename(path.dirname(found)) === 'bin') return found;
    throw new RuntimeInstallError(`The Basalt archive unpacked, but no bin/${names[0]} was found under ${this._managedDir}.`, 'BINARY_NOT_FOUND_AFTER_EXTRACT');
  }
}

module.exports = BasaltReleaseArchive;
