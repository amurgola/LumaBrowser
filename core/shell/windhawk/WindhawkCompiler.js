const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

class WindhawkCompiler {
  static ENGINE_SUBFOLDERS = { 'i686-w64-mingw32': '32', 'x86_64-w64-mingw32': '64', 'aarch64-w64-mingw32': 'arm64' };
  static DEFINES = [
    '-DUNICODE', '-D_UNICODE', '-DWINVER=0x0A00', '-D_WIN32_WINNT=0x0A00', '-D_WIN32_IE=0x0A00',
    '-DNTDDI_VERSION=0x0A000008', '-D__USE_MINGW_ANSI_STDIO=0', '-DWH_MOD',
  ];
  static TIMEOUT_MS = 180000;

  static args({ modId, version, file, target, outFile, engineDir, compilerOptions = [] }) {
    const lib = path.join(engineDir || '', WindhawkCompiler.ENGINE_SUBFOLDERS[target] || '', 'windhawk.lib');
    return [
      '-std=c++23', '-O2', '-shared', ...WindhawkCompiler.DEFINES,
      `-DWH_MOD_ID=L"${String(modId).replace(/"/g, '\\"')}"`,
      `-DWH_MOD_VERSION=L"${String(version).replace(/"/g, '\\"')}"`,
      lib, '-x', 'c++', file, '-include', 'windhawk_api.h', '-target', target,
      '-Wl,--export-all-symbols', '-o', outFile, ...compilerOptions,
    ];
  }

  static dllName(modId, version, random = Math.random) {
    return `${modId}_${version}_${Math.floor(900000 * random() + 100000)}.dll`;
  }

  constructor(install, { run = WindhawkCompiler._run, tmpDir = os.tmpdir(), random = Math.random } = {}) {
    this._install = install;
    this._run = run;
    this._tmpDir = tmpDir;
    this._random = random;
  }

  get compiler() {
    return path.join(this._install.compilerDir, 'bin', 'clang++.exe');
  }

  async compile({ source, header, modId }) {
    const dir = fs.mkdtempSync(path.join(this._tmpDir, 'luma-wh-build-'));
    try {
      const file = path.join(dir, `${modId.replace(/[^\w.-]/g, '_')}.wh.cpp`);
      fs.writeFileSync(file, source, 'utf8');
      const dllName = WindhawkCompiler.dllName(modId, header.version, this._random);
      const outputs = [];
      for (const target of header.targets) {
        const built = await this._compileTarget({ file, dir, dllName, modId, header, target });
        if (built) outputs.push(built);
      }
      if (!outputs.length) throw new Error('No compiler target for this mod is installed with Windhawk');
      return { dir, dllName, outputs };
    } catch (err) {
      try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
      throw err;
    }
  }

  async _compileTarget({ file, dir, dllName, modId, header, target }) {
    const subfolder = WindhawkCompiler.ENGINE_SUBFOLDERS[target];
    const lib = path.join(this._install.engineDir, subfolder, 'windhawk.lib');
    if (!fs.existsSync(lib) || !fs.existsSync(path.join(this._install.compilerDir, target))) return null;
    const outDir = path.join(dir, subfolder);
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, dllName);
    const args = WindhawkCompiler.args({ modId, version: header.version, file, target, outFile, engineDir: this._install.engineDir, compilerOptions: header.compilerOptions });
    const { code, output } = await this._run(this.compiler, args, { cwd: this._install.compilerDir, timeout: WindhawkCompiler.TIMEOUT_MS });
    if (code !== 0 || !fs.existsSync(outFile)) throw new Error(`Compiling for ${target} failed${output ? `:\n${output.slice(0, 4000)}` : ''}`);
    return { target, subfolder, file: outFile };
  }

  static _run(cmd, args, { cwd, timeout }) {
    return new Promise((resolve) => {
      let output = '';
      let settled = false;
      const child = spawn(cmd, args, { cwd, windowsHide: true });
      const timer = setTimeout(() => { try { child.kill(); } catch (_) {} }, timeout);
      const done = (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({ code, output: output.trim() });
      };
      child.stdout.on('data', (d) => { output += d; });
      child.stderr.on('data', (d) => { output += d; });
      child.on('error', (err) => { output += err.message; done(-1); });
      child.on('close', (code) => done(code));
    });
  }
}

module.exports = WindhawkCompiler;
