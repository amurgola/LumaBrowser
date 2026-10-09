const fs = require('fs');
const crypto = require('crypto');
const PartialFile = require('./PartialFile');

class DownloadVerifier {
  static async verifyPartial({ partPath, total, sha256, onVerify, forLabel }) {
    const size = PartialFile.size(partPath);
    DownloadVerifier._assertSize(partPath, size, total, forLabel);
    if (!sha256) return;
    const digest = await DownloadVerifier._digestWithProgress(partPath, size, onVerify, forLabel);
    DownloadVerifier._assertDigest(partPath, digest, sha256, forLabel);
  }

  static sha256File(filePath, onTick) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      let read = 0;
      stream.on('data', (buf) => {
        read += buf.length;
        hash.update(buf);
        DownloadVerifier._callQuietly(onTick, read);
      });
      stream.on('error', reject);
      stream.on('end', () => resolve(hash.digest('hex')));
    });
  }

  static _assertSize(partPath, size, total, forLabel) {
    if (!(total > 0) || size === total) return;
    DownloadVerifier._discard(partPath);
    throw new Error(
      `Download verification failed${forLabel}: expected ${total} bytes, got ${size}. The partial file was discarded; try again.`);
  }

  static async _digestWithProgress(partPath, size, onVerify, forLabel) {
    DownloadVerifier._callQuietly(onVerify, 0, size);
    try {
      return await DownloadVerifier.sha256File(partPath, (read) => { if (onVerify) onVerify(read, size); });
    } catch (err) {
      throw new Error(`Download verification failed${forLabel}: ${err.message}`);
    }
  }

  static _assertDigest(partPath, digest, sha256, forLabel) {
    if (digest === sha256) return;
    DownloadVerifier._discard(partPath);
    throw new Error(
      `Download verification failed${forLabel}: checksum mismatch (the file does not match the one published upstream). The partial file was discarded; try again.`);
  }

  static _discard(partPath) {
    try {
      fs.unlinkSync(partPath);
    } catch (_) {
    }
  }

  static _callQuietly(callback, ...args) {
    if (!callback) return;
    try {
      callback(...args);
    } catch (_) {
    }
  }
}

module.exports = DownloadVerifier;
