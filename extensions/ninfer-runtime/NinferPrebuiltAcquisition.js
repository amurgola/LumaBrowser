const fs = require('fs');
const path = require('path');
const CoreRequire = require('./CoreRequire');
const NinferCatalog = require('./NinferCatalog');
const NinferStreamingCommand = require('./NinferStreamingCommand');

const WslFormat = CoreRequire.load('music-server/runtimes/WslFormat');
const ResumableDownload = CoreRequire.load('shared/download/ResumableDownload');
const RuntimeInstallError = CoreRequire.load('shared/runtime/install/RuntimeInstallError');

class NinferPrebuiltAcquisition {
  static DOWNLOAD_LABEL = 'NInfer runtime';
  static DEFAULT_ASSET = 'ninfer-linux-x64-cuda131.tar.gz';
  static EXTRACT_TIMEOUT_MS = 10 * 60 * 1000;

  constructor(job) {
    this._job = job;
    this._prebuilt = (job.entry && job.entry.prebuilt) || NinferCatalog.PREBUILT;
    this._tarHost = path.join(job.managedDir, this._prebuilt.asset || NinferPrebuiltAcquisition.DEFAULT_ASSET);
  }

  static run(job) {
    return new NinferPrebuiltAcquisition(job).execute();
  }

  async execute() {
    const ref = this._resolveReference();
    if (!ref) return null;
    const ready = /^https?:\/\//i.test(ref) ? await this._download(ref) : this._copyLocal(ref);
    if (!ready) return null;
    if (this._job.canceled()) throw NinferPrebuiltAcquisition.canceledError();
    await this._extract();
    return { source: 'prebuilt', version: this._prebuilt.version || null };
  }

  static canceledError() {
    return new RuntimeInstallError('Install canceled.', 'CANCELED');
  }

  _resolveReference() {
    const local = fs.existsSync(this._tarHost) && fs.statSync(this._tarHost).size > 0 ? this._tarHost : null;
    return process.env.LUMA_NINFER_PREBUILT || local || this._prebuilt.url || null;
  }

  _emitResolved(name, url) {
    this._job.emit('resolved', { asset: { name }, release: { tagName: this._prebuilt.version || null, url } });
  }

  async _download(url) {
    const { emit, canceled } = this._job;
    this._emitResolved(path.basename(this._tarHost), url);
    try {
      const r = await ResumableDownload.download({
        url,
        destPath: this._tarHost,
        controller: new AbortController(),
        isCanceled: canceled,
        label: NinferPrebuiltAcquisition.DOWNLOAD_LABEL,
        onProgress: (received, total, stats) => emit('download', { received, total, bytesPerSec: stats && stats.bytesPerSec, etaMs: stats && stats.etaMs }),
        onVerify: (read, total) => emit('extract', { phase: 'start', label: `verifying ${read}/${total}` }),
      });
      if (r && r.canceled) throw NinferPrebuiltAcquisition.canceledError();
      return true;
    } catch (err) {
      if (err && err.code === 'CANCELED') throw err;
      emit('extract', { phase: 'progress', label: `prebuilt unavailable (${err.message}); trying a source build` });
      return false;
    }
  }

  _copyLocal(ref) {
    if (!fs.existsSync(ref)) return false;
    this._emitResolved(path.basename(ref), ref);
    if (path.resolve(ref) !== path.resolve(this._tarHost)) fs.copyFileSync(ref, this._tarHost);
    return true;
  }

  async _extract() {
    const { mode, distro, installDir, emit, canceled } = this._job;
    const q = WslFormat.shellQuote;
    emit('extract', { phase: 'start' });
    const tarPath = mode === 'wsl' ? WslFormat.toWslPath(this._tarHost) : this._tarHost;
    const cmd = `rm -rf ${q(installDir)} && mkdir -p ${q(installDir)} && tar -xzf ${q(tarPath)} -C ${q(installDir)} --strip-components=1 && chmod +x ${q(installDir + '/ninfer-serve')} ${q(installDir + '/bin/ninfer-serve')}`;
    const r = await NinferStreamingCommand.run({
      mode, distro, cmd, timeout: NinferPrebuiltAcquisition.EXTRACT_TIMEOUT_MS, isCanceled: canceled,
      onLine: (line) => emit('extract', { phase: 'progress', label: line }),
    });
    if (r.canceled) throw NinferPrebuiltAcquisition.canceledError();
    if (!r.ok) throw new RuntimeInstallError(`Extracting the NInfer tarball failed: ${r.tail || 'unknown error'}`, 'EXTRACT_FAILED');
  }
}

module.exports = NinferPrebuiltAcquisition;
