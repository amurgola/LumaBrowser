const BuildFs = require('../BuildFs');
const path = require('path');
const { spawnSync } = require('child_process');
const ExtensionManifests = require('../shared/ExtensionManifests');
const RequireScanner = require('../shared/RequireScanner');
const SourceTree = require('../shared/SourceTree');

const fs = BuildFs.get();

class AsarLayoutVerifier {
  constructor({ asarPath, sourceRoot, asar = require('@electron/asar'), nodePath = process.execPath, log = console.log }) {
    this._asarPath = asarPath;
    this._sourceRoot = sourceRoot;
    this._asar = asar;
    this._nodePath = nodePath;
    this._log = log;
    this._pass = 0;
    this._fail = 0;
    this._shipped = null;
  }

  verify() {
    this._shipped = this._listShipped();
    this._checkDistributablesAbsent();
    this._checkMcpServerUnpacked();
    this._checkNativeModulesUnpacked();
    this._log(`\n[verify] ${this._pass} passed, ${this._fail} failed`);
    return { pass: this._pass, fail: this._fail };
  }

  _listShipped() {
    const entries = this._asar.listPackage(this._asarPath).map((p) => p.replace(/\\/g, '/').replace(/^\//, ''));
    return new Set(entries.filter((rel) => rel && this._isFileEntry(rel)));
  }

  _isFileEntry(rel) {
    const stat = this._asar.statFile(this._asarPath, rel.split('/').join(path.sep));
    return Boolean(stat && !stat.files);
  }

  _appFiles() {
    return [...this._shipped].filter((rel) => !rel.startsWith('node_modules/'));
  }

  _checkDistributablesAbsent() {
    this._log('[verify] distributable extensions:');
    for (const dir of new ExtensionManifests(this._sourceRoot).distributableDirs()) {
      const shipped = [...this._shipped].some((rel) => rel.startsWith(`extensions/${dir}/`));
      this._record(!shipped, `distributable extension "${dir}" is not in app.asar`);
    }
  }

  _checkMcpServerUnpacked() {
    this._log('[verify] asarUnpack round-trip:');
    const tree = new SourceTree(this._sourceRoot, { files: this._appFiles() });
    for (const rel of RequireScanner.closure(tree, ['mcp-server.js'])) {
      this._record(fs.existsSync(this._unpackedPath(rel)), `${rel} is in app.asar.unpacked/`);
    }
    this._probeMcpServerLoads();
  }

  _probeMcpServerLoads() {
    const probe = spawnSync(this._nodePath, ['-e', "require('./core/shell/McpServer.js')"], {
      cwd: `${this._asarPath}.unpacked`,
      encoding: 'utf8',
      env: { ...process.env, NODE_PATH: '', ELECTRON_RUN_AS_NODE: '1' },
    });
    this._record(probe.status === 0, 'core/shell/McpServer.js loads under plain Node from app.asar.unpacked/');
    if (probe.status !== 0) this._log(String(probe.stderr).split('\n').slice(0, 6).map((l) => `           ${l}`).join('\n'));
  }

  _checkNativeModulesUnpacked() {
    this._log('[verify] native modules:');
    const natives = [...this._shipped].filter((rel) => rel.endsWith('.node'));
    const packed = natives.filter((rel) => !fs.existsSync(this._unpackedPath(rel)));
    for (const rel of packed) this._log(`  [FAIL] ${rel} is still inside app.asar`);
    this._record(packed.length === 0, `${natives.length - packed.length}/${natives.length} native .node files are in app.asar.unpacked/`);
    if ([...this._shipped].some((rel) => rel.startsWith('node_modules/koffi/'))) {
      this._record(fs.existsSync(this._unpackedPath('node_modules/koffi/package.json')), 'node_modules/koffi is in app.asar.unpacked/');
    }
  }

  _unpackedPath(rel) {
    return path.join(`${this._asarPath}.unpacked`, ...rel.split('/'));
  }

  _record(ok, message) {
    this._log(`  ${ok ? '[OK]  ' : '[FAIL]'} ${message}`);
    if (ok) this._pass++; else this._fail++;
  }
}

module.exports = AsarLayoutVerifier;
