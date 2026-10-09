const fs = require('fs');
const path = require('path');
const SysdepsCommandRunner = require('./SysdepsCommandRunner');
const SysdepsLinkerParser = require('./SysdepsLinkerParser');
const SysdepsReport = require('./SysdepsReport');

class SysdepsChecker {
  static KNOWN_LIBS = [
    { soname: 'libgomp.so.1', pkg: 'libgomp1', why: 'llama.cpp and stable-diffusion.cpp' },
    { soname: 'libnss3.so', pkg: 'libnss3', why: 'the browser engine' },
    { soname: 'libnspr4.so', pkg: 'libnspr4', why: 'the browser engine' },
    { soname: 'libasound.so.2', pkg: 'libasound2t64', why: 'audio and voice mode' },
  ];

  static LDD_PACKAGE_MAP = {
    'libgomp.so.1': 'libgomp1',
    'libnss3.so': 'libnss3',
    'libnspr4.so': 'libnspr4',
    'libasound.so.2': 'libasound2t64',
    'libvulkan.so.1': 'libvulkan1',
    'libcurl.so.4': 'libcurl4',
    'libstdc++.so.6': 'libstdc++6',
    'libgcc_s.so.1': 'libgcc-s1',
    'libcuda.so.1': 'nvidia-driver (install the NVIDIA driver)',
    'libcublas.so.12': 'libcublas12',
    'libcublasLt.so.12': 'libcublas12',
    'libcudart.so.12': 'libcudart12',
    'libgtk-3.so.0': 'libgtk-3-0',
    'libxss.so.1': 'libxss1',
    'libsecret-1.so.0': 'libsecret-1-0',
  };

  static COMMON_LIB_DIRS = [
    '/lib', '/usr/lib', '/lib64', '/usr/lib64', '/usr/local/lib',
    '/lib/x86_64-linux-gnu', '/usr/lib/x86_64-linux-gnu',
    '/lib/aarch64-linux-gnu', '/usr/lib/aarch64-linux-gnu',
  ];

  static RAW_LOG_LIMIT = 4000;

  constructor({
    exec = SysdepsCommandRunner.run,
    platform = process.platform,
    fileExists = SysdepsChecker._fileExists,
    libDirs = SysdepsChecker.COMMON_LIB_DIRS,
  } = {}) {
    this._exec = exec;
    this._platform = platform;
    this._fileExists = fileExists;
    this._libDirs = libDirs;
  }

  async checkKnownLibs() {
    if (!this._isLinux()) return this._notApplicable('not-linux');
    const { known, rawLog } = await this._readLoaderCache();
    const missing = SysdepsChecker.KNOWN_LIBS
      .filter((lib) => !this._isPresent(lib.soname, known))
      .map((lib) => ({ soname: lib.soname, pkg: lib.pkg, why: lib.why }));
    return SysdepsReport.build(missing, rawLog, { method: known ? 'ldconfig' : 'probe' }, this._platform);
  }

  async checkBinary(binaryPath) {
    if (!this._isLinux()) return this._notApplicable('not-linux');
    if (!binaryPath) return this._notApplicable('no-binary');
    const result = await this._runLdd(binaryPath);
    if (!result.ok && !result.stdout) return this._notApplicable(SysdepsChecker._lddFailure(result));
    const missing = SysdepsLinkerParser.parseLddNotFound(result.stdout).map(SysdepsChecker._withPackage);
    const rawLog = result.stdout.slice(0, SysdepsChecker.RAW_LOG_LIMIT);
    return SysdepsReport.build(missing, rawLog, { method: 'ldd', binaryPath }, this._platform);
  }

  async preflight({ binaries = [] } = {}) {
    if (!this._isLinux()) return this._notApplicable('not-linux');
    const results = [await this.checkKnownLibs()];
    for (const binary of binaries) {
      if (binary) results.push(await this.checkBinary(binary));
    }
    return SysdepsReport.merge(results, this._platform);
  }

  _isLinux() {
    return this._platform === 'linux';
  }

  _notApplicable(reason) {
    return SysdepsReport.notApplicable(reason, this._platform);
  }

  async _readLoaderCache() {
    const result = await this._exec('ldconfig', ['-p']);
    if (result.ok && result.stdout) {
      const known = SysdepsLinkerParser.parseLdconfig(result.stdout);
      return { known, rawLog: `ldconfig -p: ${known.size} entries` };
    }
    return { known: null, rawLog: `ldconfig -p unavailable (${result.stderr || result.code}); probing lib dirs` };
  }

  _isPresent(soname, known) {
    if (known) return known.has(soname);
    return this._libDirs.some((dir) => this._fileExists(path.join(dir, soname)));
  }

  _runLdd(binaryPath) {
    const binDir = path.dirname(binaryPath);
    const env = { ...process.env };
    env.LD_LIBRARY_PATH = env.LD_LIBRARY_PATH ? `${binDir}:${env.LD_LIBRARY_PATH}` : binDir;
    return this._exec('ldd', [binaryPath], { env, cwd: binDir });
  }

  static _withPackage(soname) {
    return { soname, pkg: SysdepsChecker.LDD_PACKAGE_MAP[soname] || null };
  }

  static _lddFailure(result) {
    return `ldd-failed: ${(result.stderr || String(result.code)).slice(0, 200)}`;
  }

  static _fileExists(filePath) {
    try {
      return fs.existsSync(filePath);
    } catch (_) {
      return false;
    }
  }
}

module.exports = SysdepsChecker;
