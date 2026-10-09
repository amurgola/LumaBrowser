const BuildFs = require('../BuildFs');
const os = require('os');
const path = require('path');
const AppAsarLocator = require('./AppAsarLocator');
const BytecodeStub = require('./BytecodeStub');
const ElectronBytecodeRunner = require('./ElectronBytecodeRunner');
const ExtensionManifests = require('./ExtensionManifests');
const SourceClassifier = require('./SourceClassifier');
const SourceTree = require('./SourceTree');
const UnpackGlob = require('./UnpackGlob');
const UnpackedSnapshot = require('./UnpackedSnapshot');

const fs = BuildFs.get();

class BytecodeCompiler {
  static PROJECT_PACKAGE = path.join(__dirname, '..', '..', '..', 'package.json');

  constructor({ runner, asar = require('@electron/asar'), unpackPatterns, log = console.log } = {}) {
    this._runner = runner || new ElectronBytecodeRunner();
    this._asar = asar;
    this._unpackPatterns = unpackPatterns || BytecodeCompiler.readUnpackPatterns(BytecodeCompiler.PROJECT_PACKAGE);
    this._log = log;
  }

  async compile(context) {
    const asarPath = this._locateAsar(context);
    const workDir = BytecodeCompiler._makeWorkDir(context.appOutDir);
    const appDir = path.join(workDir, 'app');
    try {
      this._extract(asarPath, appDir);
      const manifests = this._removeDistributables(appDir);
      const jsFiles = this._classify(appDir, manifests);
      this._writeStubs(appDir, jsFiles, this._runner.compile(jsFiles, workDir));
      await this._repack(appDir, asarPath);
    } finally {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
    this._log('[bytenode] Bytecode compilation complete.');
  }

  static _makeWorkDir(appOutDir) {
    const preferred = path.resolve(process.env.LUMA_BYTECODE_WORKDIR || path.dirname(appOutDir));
    const parent = BytecodeCompiler._hasDotSegment(preferred) ? os.tmpdir() : preferred;
    fs.mkdirSync(parent, { recursive: true });
    return fs.mkdtempSync(path.join(parent, 'lumab-bytenode-'));
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
    throw new Error(`[bytenode] app.asar not found under ${context.appOutDir}. electron-builder may have changed `
      + 'its layout, or "asar": false was added to package.json. This step needs asar-packed output.');
  }

  _extract(asarPath, appDir) {
    this._log(`[bytenode] Extracting ${asarPath} -> ${appDir}`);
    this._asar.extractAll(asarPath, appDir);
  }

  _removeDistributables(appDir) {
    const manifests = new ExtensionManifests(appDir, { log: this._log });
    for (const dir of manifests.distributableDirs()) {
      fs.rmSync(path.join(appDir, 'extensions', dir), { recursive: true, force: true });
      this._log(`[bytenode] Excluding distributable extension from bundle: "${dir}"`);
    }
    return new ExtensionManifests(appDir, { log: this._log });
  }

  _classify(appDir, manifests) {
    const tree = new SourceTree(appDir);
    const decisions = new SourceClassifier(tree, {
      privateExtensionDirs: manifests.privateDirs(),
      manifestBrowserFiles: manifests.browserFiles(),
    }).classify();
    this._logPlainSummary(decisions);
    const compile = [...decisions].filter(([, d]) => d.compile).map(([rel]) => tree.abs(rel));
    this._log(`[bytenode] Compiling ${compile.length} files to bytecode...`);
    return compile;
  }

  _logPlainSummary(decisions) {
    const counts = {};
    for (const d of decisions.values()) {
      if (d.compile) continue;
      const key = d.reason.split(':')[0];
      counts[key] = (counts[key] || 0) + 1;
    }
    this._log(`[bytenode] Shipping plain: ${Object.entries(counts).map(([k, n]) => `${k}=${n}`).join(', ')}`);
  }

  _writeStubs(appDir, jsFiles, failures) {
    for (const file of jsFiles) {
      const rel = path.relative(appDir, file);
      if (failures.has(file)) {
        this._log(`  [SKIP] ${rel}: ${failures.get(file)}`);
        continue;
      }
      fs.writeFileSync(file, BytecodeStub.text(path.basename(BytecodeStub.jscPathFor(file))));
    }
    this._log(`[bytenode] ${jsFiles.length - failures.size} stubs written, ${failures.size} left plain after errors`);
  }

  async _repack(appDir, asarPath) {
    const patterns = new Set([...this._unpackPatterns, ...UnpackedSnapshot.patterns(`${asarPath}.unpacked`)]);
    const unpack = UnpackGlob.build([...patterns]);
    if (fs.existsSync(asarPath)) fs.unlinkSync(asarPath);
    fs.rmSync(`${asarPath}.unpacked`, { recursive: true, force: true });
    this._log(`[bytenode] Re-packing -> ${asarPath}${unpack ? `  (unpack="${unpack}")` : ''}`);
    await this._asar.createPackageWithOptions(appDir, asarPath, unpack ? { unpack } : {});
    if (typeof this._asar.uncacheAll === 'function') this._asar.uncacheAll();
  }
}

module.exports = BytecodeCompiler;
