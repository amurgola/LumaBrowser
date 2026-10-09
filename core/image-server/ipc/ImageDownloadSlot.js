const path = require('path');
const ImageModelDownload = require('../models/ImageModelDownload');

class ImageDownloadSlot {
  static BUSY = 'A model download is already in progress.';

  constructor({ download = (opts) => ImageModelDownload.create(opts) } = {}) {
    this._download = download;
    this._active = null;
  }

  get busy() {
    return !!this._active;
  }

  cancel() {
    if (!this._active) return;
    try { this._active.cancel(); } catch (_) {}
  }

  async run({ files, dir, send, start, onDownloaded, busyError = ImageDownloadSlot.BUSY }) {
    if (this._active) return { success: false, error: busyError };
    send('start', start);
    const download = this._download({ files, dir, onEvent: send });
    this._active = download;
    try {
      const res = await download.promise;
      if (res && res.canceled) {
        send('canceled', {});
        return { success: false, canceled: true };
      }
      return await onDownloaded();
    } finally {
      this._active = null;
    }
  }

  static async reportingFailures(send, fn) {
    try {
      return await fn();
    } catch (err) {
      send('error', { message: err.message });
      return { success: false, error: err.message };
    }
  }

  static startFiles(files) {
    return files.map((f) => ({ role: f.role, file: path.basename(f.destPath) }));
  }
}

module.exports = ImageDownloadSlot;
