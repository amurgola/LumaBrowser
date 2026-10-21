const fs = require('fs');
const path = require('path');
const ModelDownload = require('../models/ModelDownload');
const HfHubClient = require('../models/HfHubClient');
const HfPinnedRepo = require('../models/HfPinnedRepo');
const FreeSpaceGuard = require('../../shared/download/FreeSpaceGuard');
const PartialFile = require('../../shared/download/PartialFile');
const SafeRepoPath = require('../../shared/download/SafeRepoPath');
const HfModelInput = require('./HfModelInput');
const LlmDownloadSlot = require('./LlmDownloadSlot');
const ModelCompanions = require('./ModelCompanions');
const ModelDownloadRequest = require('./ModelDownloadRequest');
const ModelTransfer = require('./ModelTransfer');
const ShardedProgress = require('./ShardedProgress');

class ModelFileDownloader {
  static URL_REQUIRED = 'A model URL and filename are required.';

  constructor({
    llmServerService, slot, mlxInstall, companions = new ModelCompanions(),
    download = (opts) => ModelDownload.start(opts),
    pin = (repoId, opts) => HfPinnedRepo.pin(repoId, opts),
    freeSpace = undefined,
  }) {
    this._svc = llmServerService;
    this._slot = slot;
    this._mlxInstall = mlxInstall;
    this._companions = companions;
    this._download = download;
    this._pin = pin;
    this._freeSpace = freeSpace;
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
    const pin = await this._pinHub(request.url);
    const parts = ModelFileDownloader._pinnedParts(request, pin);
    const companions = await this._companions.resolve(request.url, request.file, pin.pinned ? { revision: pin.pinned.sha } : {});
    const baseDir = ModelFileDownloader._baseDir(modelsDir, companions);
    const destPath = SafeRepoPath.join(baseDir, request.file);
    const transfer = new ModelTransfer({ send, download: this._download });
    this._slot.hold(transfer.handle);
    send('start', { file: request.file, destPath, parts: parts.length, revision: pin.revision });
    await this._guardFreeSpace(baseDir, parts, companions.downloads, request.totalBytes);
    const stopped = await this._fetchWeights(transfer, parts, baseDir, request.totalBytes, send)
      || await ModelFileDownloader._fetchCompanions(transfer, companions.downloads, baseDir, send);
    if (stopped) return stopped;
    const result = { destPath, file: request.file, mmproj: companions.mmproj ? companions.mmproj.file : null, mtp: companions.mtp ? companions.mtp.file : null };
    send('done', result);
    return { success: true, ...result };
  }

  async _pinHub(url) {
    const hubFile = HfModelInput.hubFileFromUrl(url);
    if (!hubFile) return { pinned: null, revision: null };
    try {
      const pinned = await this._pin(hubFile.repoId, { revision: hubFile.revision });
      return { pinned, revision: pinned.describe() };
    } catch (err) {
      if (HfHubClient.isAccessError(err)) throw err;
      const requested = hubFile.revision || HfHubClient.DEFAULT_REVISION;
      return { pinned: null, revision: { requested, sha: requested, pinned: false, fallbackReason: (err && err.message) || String(err) } };
    }
  }

  static _pinnedParts(request, pin) {
    const parts = request.parts || [{ url: request.url, file: request.file }];
    if (!pin.pinned) return parts.map((part) => ({ ...part, size: 0, sha256: null }));
    return parts.map((part) => {
      const hubFile = HfModelInput.hubFileFromUrl(part.url);
      const listed = hubFile && hubFile.repoId === pin.pinned.repoId ? pin.pinned.fileFor(hubFile.path) : null;
      if (!listed) return { ...part, size: 0, sha256: null };
      return { ...part, url: listed.url, size: listed.size, sha256: listed.sha256 };
    });
  }

  async _guardFreeSpace(baseDir, parts, companions, totalBytes) {
    const listed = parts.reduce((sum, part) => sum + (part.size || 0), 0);
    const weights = listed > 0 ? listed : (Number(totalBytes) || 0);
    const extras = companions.reduce((sum, c) => sum + (Number(c.approxBytes) || 0), 0);
    const onDisk = [...parts, ...companions].reduce((sum, f) => sum + ModelFileDownloader._bytesOnDisk(path.join(baseDir, f.file)), 0);
    const options = { forLabel: ' for this model' };
    if (this._freeSpace) options.freeSpace = this._freeSpace;
    await FreeSpaceGuard.assert(baseDir, Math.max(0, weights + extras - onDisk), options);
  }

  async _fetchWeights(transfer, parts, baseDir, totalBytes, send) {
    const progress = new ShardedProgress(send, totalBytes);
    for (let i = 0; i < parts.length; i++) {
      if (transfer.stopped) return transfer.stopOutcome();
      const part = parts[i];
      const dest = SafeRepoPath.join(baseDir, part.file);
      if (parts.length > 1) send('part', { index: i + 1, count: parts.length, file: part.file });
      const expected = { expectedSize: part.size, expectedSha256: part.sha256 };
      const res = await transfer.fetch(part.url, dest, parts.length === 1 ? send : progress.relay(), expected);
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
        const expected = { expectedSize: c.approxBytes, expectedSha256: c.sha256 };
        const res = await transfer.fetch(c.url, SafeRepoPath.join(baseDir, c.file), send, expected);
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

  static _bytesOnDisk(p) {
    return ModelFileDownloader._sizeOf(p) || PartialFile.size(PartialFile.pathFor(p));
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
