const fs = require('fs');
const path = require('path');

class DownloadPublish {
  static async publish(partPath, destPath, { fsImpl = fs } = {}) {
    await DownloadPublish._fsyncFile(partPath, fsImpl);
    await fsImpl.promises.rename(partPath, destPath);
    await DownloadPublish._fsyncDirectory(path.dirname(destPath), fsImpl);
  }

  static async _fsyncFile(filePath, fsImpl) {
    const handle = await fsImpl.promises.open(filePath, 'r+');
    try {
      await handle.sync();
    } finally {
      await handle.close();
    }
  }

  static async _fsyncDirectory(dirPath, fsImpl) {
    if (process.platform === 'win32') return;
    let handle = null;
    try {
      handle = await fsImpl.promises.open(dirPath, 'r');
      await handle.sync();
    } catch (_) {
    } finally {
      if (handle) await handle.close().catch(() => {});
    }
  }
}

module.exports = DownloadPublish;
