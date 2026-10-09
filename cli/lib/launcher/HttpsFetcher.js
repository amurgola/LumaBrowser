const https = require('https');
const fs = require('fs');

class HttpsFetcher {
  static USER_AGENT = 'lumabrowser-cli';
  static TIMEOUT_MS = 30000;
  static PROGRESS_EVERY_MS = 250;

  static request(url, { json = false } = {}) {
    return new Promise((resolve, reject) => {
      const req = https.get(url, { headers: HttpsFetcher._headers(json) }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          HttpsFetcher.request(res.headers.location, { json }).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        if (json) HttpsFetcher._readJson(res).then(resolve, reject);
        else resolve(res);
      });
      req.on('error', reject);
      req.setTimeout(HttpsFetcher.TIMEOUT_MS, () => req.destroy(new Error('Request timed out')));
    });
  }

  static download(url, destPath, onProgress = () => {}) {
    return new Promise((resolve, reject) => {
      const tmpPath = `${destPath}.downloading`;
      const file = fs.createWriteStream(tmpPath);
      HttpsFetcher.request(url)
        .then((res) => HttpsFetcher._pipe(res, file, { tmpPath, destPath, onProgress, resolve, reject }))
        .catch((e) => {
          file.close();
          try { fs.unlinkSync(tmpPath); } catch (_) {}
          reject(e);
        });
    });
  }

  static _headers(json) {
    return { 'User-Agent': HttpsFetcher.USER_AGENT, Accept: json ? 'application/json' : '*/*' };
  }

  static _readJson(res) {
    return new Promise((resolve, reject) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    });
  }

  static _pipe(res, file, { tmpPath, destPath, onProgress, resolve, reject }) {
    const total = parseInt(res.headers['content-length'] || '0', 10);
    let downloaded = 0;
    let lastPrint = 0;
    res.on('data', (chunk) => {
      downloaded += chunk.length;
      const now = Date.now();
      if (now - lastPrint <= HttpsFetcher.PROGRESS_EVERY_MS) return;
      lastPrint = now;
      onProgress({ downloaded, total });
    });
    res.pipe(file);
    file.on('finish', () => file.close(() => { fs.renameSync(tmpPath, destPath); resolve(); }));
    file.on('error', reject);
  }
}

module.exports = HttpsFetcher;
