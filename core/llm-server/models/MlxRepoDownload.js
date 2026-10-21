const fs = require('fs');
const FreeSpaceGuard = require('../../shared/download/FreeSpaceGuard');
const PartialFile = require('../../shared/download/PartialFile');
const ResumableDownload = require('../../shared/download/ResumableDownload');
const SafeRepoPath = require('../../shared/download/SafeRepoPath');
const HfHubClient = require('./HfHubClient');

class MlxRepoDownload {
  static SKIP_FILE = /(?:^|\/)\.gitattributes$|(?:^|\/)\.gitignore$/i;

  static start({ repoId, files, destDir, onEvent, revision = null, freeSpace = undefined }) {
    const download = new MlxRepoDownload({ repoId, files, destDir, onEvent, revision, freeSpace });
    return { promise: download.run(), cancel: () => download.cancel() };
  }

  constructor({ repoId, files, destDir, onEvent, revision, freeSpace }) {
    this._repoId = repoId;
    this._files = files;
    this._destDir = destDir;
    this._onEvent = typeof onEvent === 'function' ? onEvent : () => {};
    this._revision = revision && revision.sha ? revision : null;
    this._freeSpace = freeSpace;
    this._controller = new AbortController();
    this._canceled = false;
    this._completedBytes = 0;
  }

  async run() {
    const files = this._downloadableFiles();
    const total = files.reduce((sum, f) => sum + f.size, 0);
    await fs.promises.mkdir(this._destDir, { recursive: true });
    this._onEvent('start', { repoId: this._repoId, files: files.length, total, destDir: this._destDir, revision: this._revision });
    await this._guardFreeSpace(files, total);
    for (const file of files) {
      if (this._canceled || !(await this._downloadFile(file, total))) return { success: false, canceled: true };
    }
    this._onEvent('finalize', { destDir: this._destDir, bytes: this._completedBytes });
    return { success: true, destPath: this._destDir, bytes: this._completedBytes };
  }

  cancel() {
    this._canceled = true;
    try { this._controller.abort(); } catch (_) {}
  }

  _downloadableFiles() {
    const files = (this._files || [])
      .filter((f) => f && f.path && !MlxRepoDownload.SKIP_FILE.test(f.path))
      .map((f) => ({ path: f.path, size: Number(f.size) || 0, sha256: f.sha256 || null, destPath: SafeRepoPath.join(this._destDir, f.path) }));
    if (files.length === 0) {
      throw Object.assign(new Error('Repo has no downloadable files.'), { code: 'MLX_EMPTY_REPO' });
    }
    return files;
  }

  async _guardFreeSpace(files, total) {
    const onDisk = files.reduce((sum, f) => sum + Math.min(f.size, MlxRepoDownload._bytesOnDisk(f.destPath)), 0);
    const options = { forLabel: ` for ${this._repoId}` };
    if (this._freeSpace) options.freeSpace = this._freeSpace;
    await FreeSpaceGuard.assert(this._destDir, Math.max(0, total - onDisk), options);
  }

  async _downloadFile(file, total) {
    const result = await ResumableDownload.download({
      url: HfHubClient.resolveUrl(this._repoId, file.path, this._revision ? this._revision.sha : undefined),
      destPath: file.destPath,
      controller: this._controller,
      isCanceled: () => this._canceled,
      label: file.path,
      expectedSize: file.size,
      expectedSha256: file.sha256,
      onProgress: (received) => this._onEvent('download', { received: this._completedBytes + received, total }),
    });
    if (result && result.canceled) return false;
    this._completedBytes += Number(result && result.bytes) || file.size;
    this._onEvent('download', { received: this._completedBytes, total });
    return true;
  }

  static _bytesOnDisk(destPath) {
    return PartialFile.size(destPath) || PartialFile.size(PartialFile.pathFor(destPath));
  }
}

module.exports = MlxRepoDownload;
