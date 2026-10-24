const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const ModHeader = require('./ModHeader');
const WindhawkCompiler = require('../../core/shell/windhawk/WindhawkCompiler');

class WindhawkModChecker {
  static DEFAULT_ROOT = 'C:\\Program Files\\Windhawk';
  static ENV_ROOT = 'WINDHAWK_ROOT';
  static ENGINE_SUBFOLDERS = WindhawkCompiler.ENGINE_SUBFOLDERS;
  static TIMEOUT_MS = 180000;

  constructor({ root = process.env[WindhawkModChecker.ENV_ROOT] || WindhawkModChecker.DEFAULT_ROOT, canonicalClient = null, spawn = spawnSync } = {}) {
    this._root = root;
    this._canonicalClient = canonicalClient;
    this._spawn = spawn;
  }

  get compiler() {
    return path.join(this._root, 'Compiler', 'bin', 'clang++.exe');
  }

  available() {
    return fs.existsSync(this.compiler);
  }

  engineDir() {
    const fromIni = WindhawkModChecker._iniValue(path.join(this._root, 'windhawk.ini'), 'EnginePath');
    if (fromIni) return path.resolve(this._root, fromIni);
    const engines = path.join(this._root, 'Engine');
    const versions = fs.existsSync(engines) ? fs.readdirSync(engines).filter((v) => /^\d/.test(v)).sort(WindhawkModChecker._byVersion) : [];
    return versions.length ? path.join(engines, versions[versions.length - 1]) : null;
  }

  check(file) {
    const source = fs.readFileSync(file, 'utf8');
    let header;
    try {
      header = ModHeader.parse(source);
    } catch (err) {
      return { file, id: null, results: [], clientOk: true, ok: false, error: err.message };
    }
    const client = this._checkClient(source);
    const results = header.targets.map((target) => this._compile(file, header, target));
    const ok = client.ok && results.every((r) => r.ok || r.skipped) && results.some((r) => r.ok);
    return { file, id: header.id, results, clientOk: client.ok, clientMessage: client.message, ok };
  }

  args(file, header, target, outFile) {
    return WindhawkCompiler.args({
      modId: header.id, version: header.version, file, target, outFile, engineDir: this.engineDir(), compilerOptions: header.compilerOptions,
    });
  }

  _compile(file, header, target) {
    const lib = path.join(this.engineDir() || '', WindhawkModChecker.ENGINE_SUBFOLDERS[target] || '', 'windhawk.lib');
    const toolchain = path.join(this._root, 'Compiler', target);
    if (!fs.existsSync(lib) || !fs.existsSync(toolchain)) return { target, ok: false, skipped: true, output: `no ${target} toolchain or engine library installed` };
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'luma-wh-check-'));
    try {
      const out = path.join(dir, `${header.id || 'mod'}.dll`);
      const run = this._spawn(this.compiler, this.args(path.resolve(file), header, target, out), {
        cwd: path.join(this._root, 'Compiler'), encoding: 'utf8', timeout: WindhawkModChecker.TIMEOUT_MS, windowsHide: true,
      });
      const output = `${run.stdout || ''}${run.stderr || ''}${run.error ? run.error.message : ''}`.trim();
      return { target, ok: run.status === 0 && fs.existsSync(out), output };
    } finally {
      try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
    }
  }

  _checkClient(source) {
    const block = ModHeader.clientBlock(source);
    if (!block || !this._canonicalClient || !fs.existsSync(this._canonicalClient)) return { ok: true, message: block ? 'luma_client present' : 'no luma_client block' };
    const canonical = ModHeader.clientBlock(fs.readFileSync(this._canonicalClient, 'utf8'));
    if (canonical === block) return { ok: true, message: 'luma_client matches the canonical copy' };
    return { ok: false, message: 'luma_client block differs from integrations/windhawk/_shared/luma_client.inc.cpp (paste the canonical copy verbatim)' };
  }

  static _iniValue(file, key) {
    try {
      const buf = fs.readFileSync(file);
      const text = buf[0] === 0xFF && buf[1] === 0xFE ? buf.toString('utf16le') : buf.toString('utf8');
      const match = new RegExp(`^\\s*${key}\\s*=\\s*(.+?)\\s*$`, 'mi').exec(text.replace(/^\uFEFF/, ''));
      return match ? match[1] : null;
    } catch (_) {
      return null;
    }
  }

  static _byVersion(a, b) {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const d = (pa[i] || 0) - (pb[i] || 0);
      if (d) return d;
    }
    return 0;
  }
}

module.exports = WindhawkModChecker;
