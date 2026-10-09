const path = require('path');
const HfMlxRepo = require('../models/HfMlxRepo');
const MlxRepoDownload = require('../models/MlxRepoDownload');
const HfModelInput = require('./HfModelInput');
const LlmDownloadSlot = require('./LlmDownloadSlot');

class MlxRepoInstall {
  constructor({ slot, mlx = HfMlxRepo, download = (opts) => MlxRepoDownload.start(opts) }) {
    this._slot = slot;
    this._mlx = mlx;
    this._download = download;
  }

  async install(repoId, modelsDir, send) {
    if (this._slot.busy) return { success: false, error: LlmDownloadSlot.BUSY };
    const info = await this._mlx.fetchInfo(repoId);
    const destDir = path.join(modelsDir, HfModelInput.repoDirName(info.repoId));
    send('start', { repoId: info.repoId, destDir });
    const download = this._download({ repoId: info.repoId, files: info.files, destDir, onEvent: send });
    this._slot.hold(download);
    try {
      return MlxRepoInstall._outcome(await download.promise, destDir, send);
    } finally {
      this._slot.release();
    }
  }

  static _outcome(res, destDir, send) {
    if (res && res.canceled) {
      send('canceled', {});
      return { success: false, canceled: true };
    }
    const done = { destPath: destDir, file: path.basename(destDir) };
    send('done', done);
    return { success: true, ...done };
  }
}

module.exports = MlxRepoInstall;
