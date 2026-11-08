const fs = require('fs');
const path = require('path');
const DrafterCatalog = require('../models/DrafterCatalog');
const GgufFileName = require('../models/GgufFileName');
const HfPinnedRepo = require('../models/HfPinnedRepo');
const ModelDownload = require('../models/ModelDownload');
const FreeSpaceGuard = require('../../shared/download/FreeSpaceGuard');
const PartialFile = require('../../shared/download/PartialFile');
const SafeRepoPath = require('../../shared/download/SafeRepoPath');
const LlmDownloadSlot = require('./LlmDownloadSlot');
const ModelTransfer = require('./ModelTransfer');

class DrafterInstaller {
  static ARGS_REQUIRED = 'A drafter catalog id and the path of the model it drafts for are required.';

  static NO_FILE = 'The drafter repo has no GGUF to download.';

  constructor({
    llmServerService, slot, catalog = DrafterCatalog,
    pin = (repoId, opts) => HfPinnedRepo.pin(repoId, opts),
    download = (opts) => ModelDownload.start(opts),
    freeSpace = undefined,
  }) {
    this._svc = llmServerService;
    this._slot = slot;
    this._catalog = catalog;
    this._pin = pin;
    this._downloadFile = download;
    this._freeSpace = freeSpace;
  }

  async download(args, send) {
    try {
      return await this._download(args || {}, send);
    } catch (err) {
      send('error', { message: err.message });
      return { success: false, error: err.message };
    }
  }

  async _download({ id, modelPath }, send) {
    const entry = id ? this._catalog.getById(id) : null;
    if (!entry || !modelPath) return { success: false, error: DrafterInstaller.ARGS_REQUIRED };
    const dir = this._targetDir(modelPath);
    if (this._slot.busy) return { success: false, error: LlmDownloadSlot.BUSY };
    this._slot.hold({ cancel: () => {} });
    try {
      return await this._transfer(entry, dir, send);
    } finally {
      this._slot.release();
    }
  }

  _targetDir(modelPath) {
    const modelsDir = path.resolve(this._svc.getModelsDirConfig().effectivePath);
    const resolved = path.resolve(String(modelPath));
    const relative = path.relative(modelsDir, resolved);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`The model is not inside the models folder: ${modelPath}`);
    }
    if (!DrafterInstaller._isFile(resolved)) throw new Error(`Model file not found: ${modelPath}`);
    return path.dirname(resolved);
  }

  async _transfer(entry, dir, send) {
    const pinned = await this._pin(entry.repo, {});
    const picked = this._catalog.pickFile(entry, pinned.files);
    if (!picked) return { success: false, error: DrafterInstaller.NO_FILE };
    const file = GgufFileName.basename(picked.path);
    const destPath = SafeRepoPath.join(dir, file);
    const transfer = new ModelTransfer({ send, download: this._downloadFile });
    this._slot.hold(transfer.handle);
    send('start', {
      kind: 'drafter', id: entry.id, label: `${entry.label} drafter`, file, destPath, parts: 1, revision: pinned.describe(),
    });
    await this._guardFreeSpace(dir, destPath, picked.size);
    const expected = { expectedSize: picked.size, expectedSha256: picked.sha256 };
    const res = await transfer.fetch(pinned.urlFor(picked.path), destPath, send, expected);
    if (transfer.wasStopped(res)) return transfer.stopOutcome();
    const result = { id: entry.id, file, destPath, dir };
    send('done', { kind: 'drafter', ...result });
    return { success: true, ...result };
  }

  async _guardFreeSpace(dir, destPath, size) {
    const onDisk = DrafterInstaller._sizeOf(destPath) || PartialFile.size(PartialFile.pathFor(destPath));
    const options = { forLabel: ' for this drafter' };
    if (this._freeSpace) options.freeSpace = this._freeSpace;
    await FreeSpaceGuard.assert(dir, Math.max(0, (Number(size) || 0) - onDisk), options);
  }

  static _isFile(p) {
    try {
      return fs.statSync(p).isFile();
    } catch (_) {
      return false;
    }
  }

  static _sizeOf(p) {
    try {
      return fs.statSync(p).size;
    } catch (_) {
      return 0;
    }
  }
}

module.exports = DrafterInstaller;
