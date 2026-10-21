const SafeRepoPath = require('../../shared/download/SafeRepoPath');
const HfModelInput = require('./HfModelInput');

class ModelDownloadRequest {
  static from(args) {
    const a = args || {};
    const direct = a.hf ? HfModelInput.resolve(a.hf) : { url: a.url, file: ModelDownloadRequest._safeName(a.filename) };
    const parts = ModelDownloadRequest._parts(a.parts);
    const first = parts ? { url: parts[0].url, file: parts[0].file } : direct;
    return { ...first, parts, totalBytes: Number(a.totalBytes) || 0 };
  }

  static _parts(parts) {
    if (!Array.isArray(parts) || parts.length <= 1) return null;
    return parts.map((p) => {
      const url = (p && p.url) || String(p || '');
      return { url, file: SafeRepoPath.fileName((p && (p.filename || p.file)) || HfModelInput.fileFromUrl(url)) };
    });
  }

  static _safeName(name) {
    if (name == null || name === '') return name;
    return SafeRepoPath.fileName(name);
  }
}

module.exports = ModelDownloadRequest;
