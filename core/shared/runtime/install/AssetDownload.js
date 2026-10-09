const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const PartialFile = require('../../download/PartialFile');

class AssetDownload {
  static TIMEOUT_MS = 10 * 60 * 1000;
  static MAX_REDIRECTS = 5;

  static async toFile(url, destPath, { userAgent, onProgress, http = axios } = {}) {
    const res = await http.get(url, {
      responseType: 'stream',
      headers: { 'User-Agent': userAgent },
      timeout: AssetDownload.TIMEOUT_MS,
      maxRedirects: AssetDownload.MAX_REDIRECTS,
    });
    const partialPath = PartialFile.pathFor(destPath);
    await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
    const sha256 = await AssetDownload._streamToFile(res, partialPath, onProgress);
    await fs.promises.rename(partialPath, destPath);
    return sha256;
  }

  static _streamToFile(res, filePath, onProgress) {
    const total = parseInt((res.headers && res.headers['content-length']) || '0', 10) || 0;
    const hash = crypto.createHash('sha256');
    const writer = fs.createWriteStream(filePath);
    let received = 0;
    return new Promise((resolve, reject) => {
      res.data.on('data', (chunk) => {
        received += chunk.length;
        hash.update(chunk);
        if (typeof onProgress === 'function') onProgress(received, total);
      });
      res.data.on('error', reject);
      writer.on('error', reject);
      writer.on('finish', () => resolve(hash.digest('hex')));
      res.data.pipe(writer);
    });
  }
}

module.exports = AssetDownload;
