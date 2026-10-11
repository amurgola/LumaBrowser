const BuildFs = require('../BuildFs');
const os = require('os');
const path = require('path');
const ExtensionManifests = require('../shared/ExtensionManifests');
const AppAsarLocator = require('./AppAsarLocator');
const UnpackGlob = require('./UnpackGlob');
const UnpackedSnapshot = require('./UnpackedSnapshot');

const fs = BuildFs.get();

class DistributableExtensionPruner {
  static PROJECT_PACKAGE = path.join(__dirname, '..', '..', '..', 'package.json');

  constructor({ asar = require('@electron/asar'), unpackPatterns, log = console.log } = {}) {
    this._asar = asar;
    this._unpackPatterns = unpackPatterns
      || DistributableExtensionPruner.readUnpackPatterns(DistributableExtensionPruner.PROJECT_PACKAGE);
    this._log = log;
  }

  async prune(context) {
    const asarPath = this._locateAsar(context);
    const workDir = DistributableExtensionPruner._makeWorkDir(context.appOutDir);
    const appDir = path.join(workDir, 'app');
    try {
      const dirs = this._distributablesIn(asarPath, path.join(workDir, 'manifests'));
      if (dirs.length === 0) {
        this._log('[prune] no distributable extensions in app.asar');
        return [];
      }
      this._asar.extractAll(asarPath, appDir);
      for (const dir of dirs) {
        fs.rmSync(path.join(appDir, 'extensions', dir), { recursive: true, force: true });
        this._log(`[prune] Excluding distributable extension from bundle: "${dir}"`);
      }
      await this._repack(appDir, asarPath);
      return dirs;
    } finally {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  }

  _distributablesIn(asarPath, scratchDir) {
    const manifests = this._asar.listPackage(asarPath)
      .map((p) => p.replace(/\\/g, '/').replace(/^\//, ''))
      .filter((rel) => /^extensions\/[^/]+\/manifest\.js$/.test(rel));
    for (const rel of manifests) {
      const out = path.join(scratchDir, ...rel.split('/'));
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, this._asar.extractFile(asarPath, rel.split('/').join(path.sep)));
    }
    return [...new ExtensionManifests(scratchDir, { log: this._log }).distributableDirs()].sort();
  }

  static _makeWorkDir(appOutDir) {
    const preferred = path.resolve(path.dirname(appOutDir));
    const parent = DistributableExtensionPruner._hasDotSegment(preferred) ? os.tmpdir() : preferred;
    fs.mkdirSync(parent, { recursive: true });
    return fs.mkdtempSync(path.join(parent, 'lumab-prune-'));
  }

  static _hasDotSegment(dir) {
    return dir.split(/[\\/]/).some((segment) => segment.startsWith('.'));
  }

  static readUnpackPatterns(packageJsonPath) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return (pkg.build && pkg.build.asarUnpack) || [];
    } catch (_) {
      return [];
    }
  }

  _locateAsar(context) {
    const productName = context.packager && context.packager.appInfo && context.packager.appInfo.productName;
    const asarPath = AppAsarLocator.find(context.appOutDir, productName);
    if (asarPath) return asarPath;
    throw new Error(`[prune] app.asar not found under ${context.appOutDir}. electron-builder may have changed `
      + 'its layout, or "asar": false was added to package.json. This step needs asar-packed output.');
  }

  async _repack(appDir, asarPath) {
    const patterns = new Set([...this._unpackPatterns, ...UnpackedSnapshot.patterns(`${asarPath}.unpacked`)]);
    const unpack = UnpackGlob.build([...patterns]);
    if (fs.existsSync(asarPath)) fs.unlinkSync(asarPath);
    fs.rmSync(`${asarPath}.unpacked`, { recursive: true, force: true });
    this._log(`[prune] Re-packing -> ${asarPath}${unpack ? `  (unpack="${unpack}")` : ''}`);
    await this._asar.createPackageWithOptions(appDir, asarPath, unpack ? { unpack } : {});
    if (typeof this._asar.uncacheAll === 'function') this._asar.uncacheAll();
  }
}

module.exports = DistributableExtensionPruner;
