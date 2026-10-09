const fs = require('fs');
const path = require('path');
const ModelDownload = require('../models/ModelDownload');
const HfModelInput = require('./HfModelInput');
const LlmDownloadSlot = require('./LlmDownloadSlot');
const ModelCompanions = require('./ModelCompanions');
const ModelDownloadRequest = require('./ModelDownloadRequest');
const ModelTransfer = require('./ModelTransfer');
const ShardedProgress = require('./ShardedProgress');

class ModelFileDownloader {
  static URL_REQUIRED = 'A model URL and filename are required.';

  constructor({ llmServerService, slot, mlxInstall, companions = new ModelCompanions(), download = (opts) => ModelDownload.start(opts) }) {
    this._svc = llmServerService;
    this._slot = slot;
    this._mlxInstall = mlxInstall;
    this._companions = companions;
    this._download = download;
  }

  async download(args, send) {
    try {
      const modelsDir = this._svc.getModelsDirConfig().effectivePath;
      if (args && args.mlx && args.repoId) return await this._mlxInstall.install(args.repoId, modelsDir, send);
      return await this._downloadGguf(ModelDownloadRequest.from(args), modelsDir, send);
    } catch (err) {
      send('error', { message: err.message });
      return { success: false, error: err.message };
    }
  }

  async _downloadGguf(request, modelsDir, send) {
    if (!request.url || !request.file) return { success: false, error: ModelFileDownloader.URL_REQUIRED };
    if (this._slot.busy) return { success: false, error: LlmDownloadSlot.BUSY };
    this._slot.hold({ cancel: () => {} });
    try {
      return await this._transfer(request, modelsDir, send);
    } finally {
      this._slot.release();
    }
  }

  async _transfer(request, modelsDir, send) {
    const companions = await this._companions.resolve(request.url, request.file);
    const baseDir = ModelFileDownloader._baseDir(modelsDir, companions);
    const destPath = path.join(baseDir, request.file);
    const transfer = new ModelTransfer({ send, download: this._download });
    this._slot.hold(transfer.handle);
    const parts = request.parts || [{ url: request.url, file: request.file }];
    send('start', { file: request.file, destPath, parts: parts.length });
    const stopped = await this._fetchWeights(transfer, parts, baseDir, request.totalBytes, send)
      || await ModelFileDownloader._fetchCompanions(transfer, companions.downloads, baseDir, send);
    if (stopped) return stopped;
    const result = { destPath, file: request.file, mmproj: companions.mmproj ? companions.mmproj.file : null, mtp: companions.mtp ? companions.mtp.file : null };
    send('done', result);
    return { success: true, ...result };
  }

  async _fetchWeights(transfer, parts, baseDir, totalBytes, send) {
    const progress = new ShardedProgress(send, totalBytes);
    for (let i = 0; i < parts.length; i++) {
      if (transfer.stopped) return transfer.stopOutcome();
      const part = parts[i];
      const dest = path.join(baseDir, part.file);
      if (parts.length > 1) send('part', { index: i + 1, count: parts.length, file: part.file });
      const res = await transfer.fetch(part.url, dest, parts.length === 1 ? send : progress.relay());
      if (transfer.wasStopped(res)) return transfer.stopOutcome();
      progress.addFinished(ModelFileDownloader._sizeOf(dest));
    }
    return null;
  }

  static async _fetchCompanions(transfer, companions, baseDir, send) {
    for (const c of companions) {
      if (transfer.stopped) return transfer.stopOutcome();
      send('companion-start', { kind: c.kind, label: c.label, file: c.file, approxBytes: c.approxBytes });
      try {
        const res = await transfer.fetch(c.url, path.join(baseDir, c.file), send);
        if (transfer.wasStopped(res)) return transfer.stopOutcome();
      } catch (err) {
        send('companion-error', { kind: c.kind, message: (err && err.message) || `${c.label} download failed` });
      }
    }
    return null;
  }

  static _baseDir(modelsDir, companions) {
    if (companions.downloads.length === 0) return modelsDir;
    const dir = path.join(modelsDir, HfModelInput.repoDirName(companions.repoId));
    try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
    return dir;
  }

  static _sizeOf(p) {
    try {
      return fs.statSync(p).size;
    } catch (_) {
      return 0;
    }
  }
}

module.exports = ModelFileDownloader;
