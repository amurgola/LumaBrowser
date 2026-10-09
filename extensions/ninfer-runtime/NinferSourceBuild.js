const CoreRequire = require('./CoreRequire');
const NinferCatalog = require('./NinferCatalog');
const NinferScripts = require('./NinferScripts');
const NinferStreamingCommand = require('./NinferStreamingCommand');
const NinferToolchain = require('./NinferToolchain');

const WslFormat = CoreRequire.load('music-server/runtimes/WslFormat');
const RuntimeInstallError = CoreRequire.load('shared/runtime/install/RuntimeInstallError');

class NinferSourceBuild {
  static CLONE_TIMEOUT_MS = 15 * 60 * 1000;
  static BUILD_TIMEOUT_MS = 60 * 60 * 1000;
  static PACK_TIMEOUT_MS = 5 * 60 * 1000;
  static APT_HINT = 'Install the CUDA Toolkit 13.1 from NVIDIA, then: sudo apt install cmake ninja-build g++ git pkg-config libcurl4-openssl-dev libavformat-dev libavcodec-dev libavutil-dev libswscale-dev';

  constructor(job) {
    this._job = job;
    this._src = (job.entry && job.entry.source) || NinferCatalog.SOURCE;
  }

  static run(job) {
    return new NinferSourceBuild(job).execute();
  }

  async execute() {
    await this._requireToolchain();
    this._writeScripts();
    await this._step('clone', NinferSourceBuild.CLONE_TIMEOUT_MS, 'CLONE_FAILED', 'Cloning NInfer failed');
    await this._step('build', NinferSourceBuild.BUILD_TIMEOUT_MS, 'BUILD_FAILED', 'Building NInfer failed');
    await this._step('pack', NinferSourceBuild.PACK_TIMEOUT_MS, 'PACKAGE_FAILED', 'Packaging the NInfer build failed', ` ${WslFormat.shellQuote(this._wrapperScript)}`);
    return { source: 'source-build', version: this._src.commit };
  }

  async _requireToolchain() {
    const { mode, distro, managedDir, entry } = this._job;
    const tc = await NinferToolchain.check(mode, distro, managedDir);
    if (tc.ok) return;
    const asset = ((entry && entry.prebuilt) || NinferCatalog.PREBUILT).asset;
    const where = mode === 'wsl' ? `inside WSL (${distro})` : 'on this machine';
    throw new RuntimeInstallError(
      `No prebuilt NInfer build is available (drop ${asset || 'the tarball'} into ${managedDir} to use one), and a source build needs tools that are missing ${where}: ${tc.missing.join(', ')}. `
      + NinferSourceBuild.APT_HINT,
      'NINFER_TOOLCHAIN_MISSING',
      { missing: tc.missing, found: tc.found, probeError: tc.probeError || null, mode, distro },
    );
  }

  _writeScripts() {
    const { mode, managedDir, installDir, emit } = this._job;
    emit('resolved', { asset: { name: `source build @ ${this._src.commit}` }, release: { tagName: this._src.commit, url: this._src.repo } });
    emit('extract', { phase: 'start', label: 'cloning' });
    const body = NinferScripts.buildScript(this._src, `${installDir}-src`, installDir);
    this._buildScript = NinferScripts.write(managedDir, 'build-ninfer.sh', body, mode);
    this._wrapperScript = NinferScripts.write(managedDir, 'ninfer-serve-wrapper.sh', NinferScripts.WRAPPER, mode);
  }

  async _step(name, timeout, code, failure, extra = '') {
    const { mode, distro, emit, canceled } = this._job;
    const r = await NinferStreamingCommand.run({
      mode, distro, cmd: `bash ${WslFormat.shellQuote(this._buildScript)} ${name}${extra}`, timeout, isCanceled: canceled,
      onLine: (line) => emit('extract', { phase: 'progress', label: line }),
    });
    if (r.canceled && name !== 'pack') throw new RuntimeInstallError('Install canceled.', 'CANCELED');
    if (!r.ok) throw new RuntimeInstallError(`${failure}: ${r.tail || 'unknown error'}`, code);
  }
}

module.exports = NinferSourceBuild;
