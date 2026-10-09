const fs = require('fs');
const path = require('path');
const ResumableDownload = require('../../shared/download/ResumableDownload');
const HfHubClient = require('./HfHubClient');

class MlxRepoDownload {
  static SKIP_FILE = /(?:^|\/)\.gitattributes$|(?:^|\/)\.gitignore$/i;

  static start({ repoId, files, destDir, onEvent }) {
    const download = new MlxRepoDownload({ repoId, files, destDir, onEvent });
    return { promise: download.run(), cancel: () => download.cancel() };
  }

  constructor({ repoId, files, destDir, onEvent }) {
    this._repoId = repoId;
    this._files = files;
    this._destDir = destDir;
    this._onEvent = typeof onEvent === 'function' ? onEvent : () => {};
    this._controller = new AbortController();
    this._canceled = false;
    this._completedBytes = 0;
  }

  async run() {
    await fs.promises.mkdir(this._destDir, { recursive: true });
    const files = this._downloadableFiles();
    const total = files.reduce((sum, f) => sum + (Number(f.size) || 0), 0);
    this._onEvent('start', { repoId: this._repoId, files: files.length, total, destDir: this._destDir });
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
    const files = (this._files || []).filter((f) => f && f.path && !MlxRepoDownload.SKIP_FILE.test(f.path));
    if (files.length === 0) {
      throw Object.assign(new Error('Repo has no downloadable files.'), { code: 'MLX_EMPTY_REPO' });
    }
    return files;
  }

  async _downloadFile(file, total) {
    const result = await ResumableDownload.download({
      url: HfHubClient.resolveUrl(this._repoId, file.path),
      destPath: path.join(this._destDir, file.path),
      controller: this._controller,
      isCanceled: () => this._canceled,
      label: file.path,
      onProgress: (received) => this._onEvent('download', { received: this._completedBytes + received, total }),
    });
    if (result && result.canceled) return false;
    this._completedBytes += Number(result && result.bytes) || Number(file.size) || 0;
    this._onEvent('download', { received: this._completedBytes, total });
    return true;
  }
}

module.exports = MlxRepoDownload;
