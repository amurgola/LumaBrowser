const fs = require('fs');
const path = require('path');
const SherpaRuntimeLayout = require('./SherpaRuntimeLayout');
const TarballDownloader = require('./TarballDownloader');

class SherpaRuntimeInstaller {
  async install({ runtimesRoot, onEvent }) {
    this._setupSharedVariablesFromParameters(runtimesRoot, onEvent);
    this._resolvePlatformPackage();
    this._resolveTargets();
    await this._prepareStaging();
    for (const target of this._targets) await this._installPackage(target);
    return this._writeManifest();
  }

  _setupSharedVariablesFromParameters(runtimesRoot, onEvent) {
    this._runtimesRoot = runtimesRoot;
    this._onEvent = onEvent;
    this._stagingDir = path.join(runtimesRoot, '.tmp');
  }

  _resolvePlatformPackage() {
    this._platformPackage = SherpaRuntimeLayout.platformPackageName();
    if (this._platformPackage) return;
    const err = new Error(`No prebuilt sherpa-onnx binary for ${process.platform}-${process.arch}.`);
    err.code = 'NO_ASSET_FOR_PLATFORM';
    err.detail = { platform: process.platform, arch: process.arch };
    throw err;
  }

  _resolveTargets() {
    this._targets = [
      { pkg: SherpaRuntimeLayout.ADDON_PACKAGE, dest: SherpaRuntimeLayout.addonDir(this._runtimesRoot) },
      { pkg: this._platformPackage, dest: SherpaRuntimeLayout.platformDir(this._runtimesRoot) },
    ];
    this._emit('resolved', { version: SherpaRuntimeLayout.VERSION, packages: this._targets.map((t) => t.pkg) });
  }

  async _prepareStaging() {
    await fs.promises.mkdir(this._stagingDir, { recursive: true });
  }

  async _installPackage(target) {
    const url = SherpaRuntimeLayout.tarballUrl(target.pkg, SherpaRuntimeLayout.VERSION);
    const stagingPath = path.join(this._stagingDir, `${target.pkg}-${Date.now()}.tgz`);
    await TarballDownloader.download(url, stagingPath, (received, total) =>
      this._emit('download', { pkg: target.pkg, received, total }));
    this._emit('extract', { pkg: target.pkg, phase: 'start' });
    await fs.promises.rm(target.dest, { recursive: true, force: true });
    await fs.promises.mkdir(target.dest, { recursive: true });
    await TarballDownloader.extract(stagingPath, target.dest);
    this._emit('extract', { pkg: target.pkg, phase: 'done' });
    await fs.promises.unlink(stagingPath).catch(() => {});
  }

  async _writeManifest() {
    const manifest = {
      id: SherpaRuntimeLayout.DIR_NAME,
      version: SherpaRuntimeLayout.VERSION,
      platformPackage: this._platformPackage,
      installedAt: new Date().toISOString(),
    };
    await fs.promises.writeFile(SherpaRuntimeLayout.manifestPath(this._runtimesRoot), JSON.stringify(manifest, null, 2));
    this._emit('finalize', manifest);
    return manifest;
  }

  _emit(type, payload) {
    try {
      if (typeof this._onEvent === 'function') this._onEvent(type, payload || {});
    } catch (_) {}
  }
}

module.exports = SherpaRuntimeInstaller;
