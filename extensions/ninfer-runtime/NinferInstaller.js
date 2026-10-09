const fs = require('fs');
const path = require('path');
const CoreRequire = require('./CoreRequire');
const NinferCatalog = require('./NinferCatalog');
const NinferGpuProbe = require('./NinferGpuProbe');
const NinferManifest = require('./NinferManifest');
const NinferPrebuiltAcquisition = require('./NinferPrebuiltAcquisition');
const NinferShell = require('./NinferShell');
const NinferSourceBuild = require('./NinferSourceBuild');

const Wsl = CoreRequire.load('music-server/runtimes/Wsl');
const WslFormat = CoreRequire.load('music-server/runtimes/WslFormat');
const InstallEvents = CoreRequire.load('shared/runtime/install/InstallEvents');
const RuntimeInstallError = CoreRequire.load('shared/runtime/install/RuntimeInstallError');

class NinferInstaller {
  constructor({ entry, managedDir, onEvent, isCanceled }) {
    this._job = {
      entry: entry || null,
      managedDir,
      emit: InstallEvents.emitter(onEvent),
      canceled: () => (typeof isCanceled === 'function' ? !!isCanceled() : false),
      mode: NinferShell.currentMode(),
      distro: null,
      installDir: null,
    };
  }

  static install(options) {
    return new NinferInstaller(options).execute();
  }

  async execute() {
    await this._resolveDistro();
    await this._prepareInstallDir();
    const acquired = await this._acquire();
    await this._verifyBinary();
    const version = await this._readVersion(acquired.version);
    return this._finalize(acquired, version);
  }

  async _resolveDistro() {
    if (this._job.mode !== 'wsl') return;
    const w = await Wsl.detect();
    if (!w.wsl2 || !w.distro) throw new RuntimeInstallError(`WSL2 is required on Windows: ${w.note || 'no WSL2 distro found.'}`, 'WSL_NOT_READY', { wsl: w });
    if (!w.nvidiaDriverOk) throw new RuntimeInstallError(`The GPU is not visible inside WSL (${w.distro}): ${w.note || 'nvidia-smi failed.'}`, 'WSL_NO_GPU', { wsl: w });
    this._job.distro = w.distro;
  }

  async _prepareInstallDir() {
    const { mode, distro, managedDir } = this._job;
    fs.mkdirSync(managedDir, { recursive: true });
    if (mode !== 'wsl') {
      this._job.installDir = path.join(managedDir, 'ninfer');
      return;
    }
    const home = await Wsl.runInWsl(distro, 'echo "$HOME"', { timeout: NinferShell.PROBE_TIMEOUT_MS });
    const h = home.ok ? String(home.stdout || '').trim() : '';
    if (!h.startsWith('/')) throw new RuntimeInstallError('Could not resolve $HOME inside the WSL distro.', 'WSL_HOME_UNRESOLVED');
    this._job.installDir = `${h}/.lumabrowser/runtimes/${NinferCatalog.RUNTIME_ID}`;
  }

  async _acquire() {
    const prebuilt = await NinferPrebuiltAcquisition.run(this._job);
    return prebuilt || NinferSourceBuild.run(this._job);
  }

  get _binPath() {
    return `${this._job.installDir}/ninfer-serve`;
  }

  async _verifyBinary() {
    const { mode, distro, emit } = this._job;
    emit('extract', { phase: 'done' });
    const probe = await NinferShell.run(mode, distro, `${WslFormat.shellQuote(this._binPath)} --help 2>&1 | head -1`, { timeout: NinferShell.PROBE_TIMEOUT_MS });
    if (/usage:/i.test(String(probe.stdout || '') + String(probe.stderr || ''))) return;
    throw new RuntimeInstallError(`The installed ninfer-serve did not run: ${(probe.stderr || probe.stdout || '').trim().slice(0, 300)}`, 'BINARY_NOT_RUNNABLE');
  }

  async _readVersion(fallback) {
    const { mode, distro, installDir } = this._job;
    try {
      const c = await NinferShell.run(mode, distro, `cat ${WslFormat.shellQuote(installDir + '/COMMIT')} 2>/dev/null`, { timeout: NinferShell.PROBE_TIMEOUT_MS });
      if (c.ok && String(c.stdout || '').trim()) return String(c.stdout).trim();
    } catch (_) {}
    return fallback;
  }

  async _finalize(acquired, version) {
    const { mode, distro, installDir, managedDir, emit } = this._job;
    const gpu = await NinferGpuProbe.probe(mode, distro);
    const match = gpu && gpu.match;
    const manifest = {
      id: NinferCatalog.RUNTIME_ID,
      mode,
      distro,
      installDir,
      binPath: this._binPath,
      version,
      source: acquired.source,
      cudaDevice: match ? match.index : null,
      gpuName: match ? match.name : null,
      vramBytes: match ? match.vramBytes : null,
      gpus: gpu ? gpu.devices : [],
      installedAt: new Date().toISOString(),
    };
    NinferManifest.write(managedDir, manifest);
    emit('finalize', { binaryPath: this._binPath, manifest });
    return { binaryPath: this._binPath, manifest };
  }
}

module.exports = NinferInstaller;
