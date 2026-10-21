const fs = require('fs');
const crypto = require('crypto');
const PartialFile = require('./PartialFile');
const ChunkMeta = require('./ChunkMeta');
const DownloadError = require('./DownloadError');

class DownloadVerifier {
  static async verifyPartial({ partPath, metaPath = null, total, sha256, digest = null, onVerify, forLabel = '' }) {
    const size = PartialFile.size(partPath);
    DownloadVerifier._assertSize({ partPath, metaPath, size, total, forLabel });
    if (!sha256) return;
    const expected = String(sha256).toLowerCase();
    const actual = digest ? String(digest).toLowerCase() : await DownloadVerifier._digestWithProgress(partPath, size, onVerify, forLabel);
    DownloadVerifier._assertDigest({ partPath, metaPath, digest: actual, sha256: expected, forLabel });
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

  static _assertSize({ partPath, metaPath, size, total, forLabel }) {
    if (!(total > 0) || size === total) return;
    DownloadVerifier._discard(partPath, metaPath);
    throw DownloadError.integrity(
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

  static _assertDigest({ partPath, metaPath, digest, sha256, forLabel }) {
    if (digest === sha256) return;
    DownloadVerifier._discard(partPath, metaPath);
    throw DownloadError.integrity(
      `Download verification failed${forLabel}: checksum mismatch (the file does not match the one published upstream). The partial file was discarded; try again.`);
  }

  static _discard(partPath, metaPath) {
    try {
      fs.unlinkSync(partPath);
    } catch (_) {
    }
    if (metaPath) ChunkMeta.clear(metaPath);
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
