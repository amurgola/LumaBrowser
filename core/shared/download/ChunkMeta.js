const fs = require('fs');

class ChunkMeta {
  static pathFor(partPath) {
    return partPath + '.meta';
  }

  static plan(total, chunkSize) {
    return { total, chunkSize, done: new Array(Math.ceil(total / chunkSize)).fill(false) };
  }

  static load(metaPath, total, chunkSize) {
    const parsed = ChunkMeta._readJson(metaPath);
    return ChunkMeta._matches(parsed, total, chunkSize) ? parsed : null;
  }

  static save(metaPath, meta) {
    const tmpPath = metaPath + '.tmp';
    fs.writeFileSync(tmpPath, JSON.stringify(meta));
    fs.renameSync(tmpPath, metaPath);
  }

  static clear(metaPath) {
    ChunkMeta._unlinkQuietly(metaPath);
    ChunkMeta._unlinkQuietly(metaPath + '.tmp');
  }

  static exists(metaPath) {
    return fs.existsSync(metaPath) || fs.existsSync(metaPath + '.tmp');
  }

  static _readJson(metaPath) {
    try {
      return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    } catch (_) {
      return null;
    }
  }

  static _matches(meta, total, chunkSize) {
    if (!meta || meta.total !== total || meta.chunkSize !== chunkSize) return false;
    if (!Array.isArray(meta.done) || meta.done.length !== Math.ceil(total / chunkSize)) return false;
    return meta.done.every((done) => typeof done === 'boolean');
  }

  static _unlinkQuietly(filePath) {
    try {
      fs.unlinkSync(filePath);
    } catch (_) {
    }
  }
}

module.exports = ChunkMeta;
