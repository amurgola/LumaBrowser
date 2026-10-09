const BuildFs = require('../BuildFs');
const path = require('path');
const BytecodeCompiler = require('../bytecode/BytecodeCompiler');
const UnpackGlob = require('../bytecode/UnpackGlob');
const AsarBytecodeVerifier = require('./AsarBytecodeVerifier');
const FakeBytecodeRunner = require('./FakeBytecodeRunner');

const fs = BuildFs.get();

class SimulatedPack {
  static NOT_SHIPPED = new Set(['node_modules', 'tests', 'tools', 'scripts', 'Documentation', 'documentation', 'tmp',
    'dist', 'cli', 'ide', 'docker', 'build', 'models', 'runtimes', 'router', 'research', 'test-data',
    'package-lock.json', 'knip.json']);

  static STUB_MODULES = [
    'node_modules/@modelcontextprotocol/sdk/index.js',
    'node_modules/axios/index.js',
    'node_modules/koffi/package.json',
    'node_modules/koffi/index.js',
    'node_modules/koffi/build/koffi/win32_x64/koffi.node',
  ];

  constructor({ projectRoot, asar = require('@electron/asar'), log = console.log, scratchParent = null, rows }) {
    this._projectRoot = projectRoot;
    this._scratchParent = scratchParent;
    this._rows = rows;
    this._asar = asar;
    this._log = log;
  }

  async run() {
    const scratch = this._makeScratch();
    const appOutDir = path.join(scratch, 'win-unpacked');
    try {
      const staging = this._stage(path.join(scratch, 'staging'));
      const asarPath = await this._packFake(staging, appOutDir);
      await this._compile(appOutDir);
      return new AsarBytecodeVerifier({ asarPath, sourceRoot: this._projectRoot, asar: this._asar, log: this._log, rows: this._rows }).verify();
    } finally {
      SimulatedPack._removeScratch(scratch, appOutDir);
    }
  }

  static _removeScratch(scratch, appOutDir) {
    const asarPath = path.join(appOutDir, 'resources', 'app.asar');
    if (fs.existsSync(asarPath)) fs.unlinkSync(asarPath);
    fs.rmSync(scratch, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  }

  _makeScratch() {
    const parent = this._scratchParent || path.join(this._projectRoot, 'tmp');
    fs.mkdirSync(parent, { recursive: true });
    return fs.mkdtempSync(path.join(parent, 'asar-verify-'));
  }

  _stage(staging) {
    fs.mkdirSync(staging, { recursive: true });
    for (const entry of fs.readdirSync(this._projectRoot, { withFileTypes: true })) {
      if (!SimulatedPack._isShipped(entry.name)) continue;
      fs.cpSync(path.join(this._projectRoot, entry.name), path.join(staging, entry.name), { recursive: true });
    }
    for (const rel of SimulatedPack.STUB_MODULES) SimulatedPack._writeStub(staging, rel);
    return staging;
  }

  static _isShipped(name) {
    return !name.startsWith('.') && !name.toLowerCase().endsWith('.md') && !SimulatedPack.NOT_SHIPPED.has(name);
  }

  static _writeStub(staging, rel) {
    const full = path.join(staging, ...rel.split('/'));
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, rel.endsWith('package.json') ? '{"name":"stub"}' : `// stub for ${rel}\nmodule.exports = {};\n`);
  }

  async _packFake(staging, appOutDir) {
    const asarPath = path.join(appOutDir, 'resources', 'app.asar');
    fs.mkdirSync(path.dirname(asarPath), { recursive: true });
    const patterns = BytecodeCompiler.readUnpackPatterns(path.join(this._projectRoot, 'package.json'));
    await this._asar.createPackageWithOptions(staging, asarPath, { unpack: UnpackGlob.build(patterns) });
    this._log(`[verify] fake app.asar packed at ${asarPath}`);
    return asarPath;
  }

  async _compile(appOutDir) {
    const compiler = new BytecodeCompiler({ runner: new FakeBytecodeRunner(), asar: this._asar, log: this._log });
    await compiler.compile({ appOutDir });
  }
}

module.exports = SimulatedPack;
