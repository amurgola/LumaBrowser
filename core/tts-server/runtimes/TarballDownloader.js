const fs = require('fs');
const { execFile } = require('child_process');
const axios = require('axios');

class TarballDownloader {
  static DOWNLOAD_TIMEOUT_MS = 10 * 60 * 1000;
  static EXTRACT_TIMEOUT_MS = 5 * 60 * 1000;
  static USER_AGENT = 'LumaBrowser-VoiceSetup';
  static PARTIAL_SUFFIX = '.partial';

  static async download(url, destPath, onProgress) {
    const response = await TarballDownloader._request(url);
    const total = Number(response.headers['content-length']) || null;
    const partPath = destPath + TarballDownloader.PARTIAL_SUFFIX;
    const out = fs.createWriteStream(partPath);
    try {
      const received = await TarballDownloader._pipe(response.data, out, total, onProgress);
      TarballDownloader._assertComplete(url, received, total);
    } catch (err) {
      await TarballDownloader._discard(out, partPath);
      throw err;
    }
    await fs.promises.rename(partPath, destPath);
  }

  static extract(archivePath, destDir) {
    return new Promise((resolve, reject) => {
      const args = ['-xzf', archivePath, '--strip-components', '1', '-C', destDir];
      execFile('tar', args, { timeout: TarballDownloader.EXTRACT_TIMEOUT_MS }, (err, _stdout, stderr) => {
        if (err) reject(new Error(`extract failed: ${stderr || err.message}`));
        else resolve();
      });
    });
  }

  static _request(url) {
    return axios.get(url, {
      responseType: 'stream',
      timeout: TarballDownloader.DOWNLOAD_TIMEOUT_MS,
      headers: { 'User-Agent': TarballDownloader.USER_AGENT },
      maxRedirects: 5,
    });
  }

  static _pipe(body, out, total, onProgress) {
    let received = 0;
    return new Promise((resolve, reject) => {
      body.on('data', (chunk) => {
        received += chunk.length;
        TarballDownloader._report(onProgress, received, total);
      });
      body.on('error', reject);
      out.on('error', reject);
      out.on('finish', () => resolve(received));
      body.pipe(out);
    });
  }

  static _report(onProgress, received, total) {
    try {
      if (onProgress) onProgress(received, total);
    } catch (_) {}
  }

  static _assertComplete(url, received, total) {
    if (!total || received === total) return;
    const err = new Error(`Download incomplete: received ${received} of ${total} bytes.`);
    err.code = 'DOWNLOAD_INCOMPLETE';
    err.detail = { url, received, total };
    throw err;
  }

  static async _discard(out, partPath) {
    await new Promise((resolve) => {
      if (out.closed) {
        resolve();
        return;
      }
      out.once('close', resolve);
      out.destroy();
    });
    try {
      await fs.promises.unlink(partPath);
    } catch (_) {}
  }
}

module.exports = TarballDownloader;
