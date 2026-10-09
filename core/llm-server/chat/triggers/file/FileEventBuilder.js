const fs = require('fs');
const path = require('path');
const TriggerPayload = require('../TriggerPayload');
const FileGlobMatcher = require('./FileGlobMatcher');
const WatchFolder = require('./WatchFolder');

class FileEventBuilder {
  static PREVIEW_BYTES = 8 * 1024;

  static async build(kind, dir, absPath, stat) {
    const event = FileEventBuilder._facts(kind, dir, absPath, stat);
    if (kind !== 'remove') await FileEventBuilder._addPreview(event, absPath, stat);
    return TriggerPayload.sanitize(event);
  }

  static async forPath(dir, candidate) {
    const abs = WatchFolder.resolveInside(dir, candidate);
    let stat;
    try {
      stat = await fs.promises.stat(abs);
    } catch (_) {
      throw new Error(`file not found in the watch folder: ${candidate}`);
    }
    if (!stat.isFile()) throw new Error(`not a file: ${candidate}`);
    const event = await FileEventBuilder.build('add', dir, abs, stat);
    event.synthetic = true;
    return event;
  }

  static looksText(buffer) {
    const n = Math.min(buffer.length, FileEventBuilder.PREVIEW_BYTES);
    for (let i = 0; i < n; i++) if (buffer[i] === 0) return false;
    return true;
  }

  static _facts(kind, dir, absPath, stat) {
    return {
      receivedAt: new Date().toISOString(),
      event: kind,
      path: absPath,
      relPath: FileGlobMatcher.toPosix(path.relative(dir, absPath)),
      name: path.basename(absPath),
      ext: path.extname(absPath).slice(1).toLowerCase(),
      dir,
      size: stat ? stat.size : null,
      mtime: stat ? new Date(stat.mtimeMs).toISOString() : null,
    };
  }

  static async _addPreview(event, absPath, stat) {
    if (!stat || stat.size <= 0) {
      event.isText = true;
      event.preview = '';
      return;
    }
    try {
      const head = await FileEventBuilder._readHead(absPath, Math.min(FileEventBuilder.PREVIEW_BYTES, stat.size));
      event.isText = FileEventBuilder.looksText(head);
      if (!event.isText) return;
      event.preview = head.toString('utf8');
      event.previewTruncated = stat.size > head.length;
    } catch (_) {}
  }

  static async _readHead(absPath, length) {
    const handle = await fs.promises.open(absPath, 'r');
    try {
      const buffer = Buffer.alloc(length);
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
      return buffer.subarray(0, bytesRead);
    } finally {
      await handle.close();
    }
  }
}

module.exports = FileEventBuilder;
