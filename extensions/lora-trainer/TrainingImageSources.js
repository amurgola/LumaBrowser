const fs = require('fs');
const path = require('path');

class TrainingImageSources {
  static FILE_EXT = /\.(png|jpe?g)$/i;
  static PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];
  static JPEG_MAGIC = [0xff, 0xd8, 0xff];
  static UNSUPPORTED = 'not a PNG or JPEG picture';

  constructor({ host, fsOps = fs }) {
    this._host = host;
    this._fs = fsOps;
  }

  collect({ artifactIds = [], paths = [], folder = null }, limit) {
    const found = { images: [], skipped: [] };
    for (const id of artifactIds) this._add(found, id, () => this._artifactBytes(id));
    for (const file of [...paths, ...this._folderFiles(folder, found)]) this._add(found, file, () => this._fs.readFileSync(file));
    found.images = found.images.slice(0, limit);
    return found;
  }

  _add(found, source, readBytes) {
    try {
      const bytes = readBytes();
      const ext = TrainingImageSources.extOf(bytes);
      if (ext) found.images.push({ source, bytes, ext });
      else found.skipped.push({ source, reason: TrainingImageSources.UNSUPPORTED });
    } catch (err) {
      found.skipped.push({ source, reason: err.message });
    }
  }

  _artifactBytes(id) {
    const artifact = this._host.artifact(id);
    if (!artifact) throw new Error('no picture with this id in the chat');
    if (artifact.type !== 'image' || !artifact.content) throw new Error('this artifact is not a picture');
    return Buffer.from(artifact.content, 'base64');
  }

  _folderFiles(folder, found) {
    if (!folder) return [];
    try {
      return this._fs.readdirSync(folder, { withFileTypes: true })
        .filter((entry) => entry.isFile() && TrainingImageSources.FILE_EXT.test(entry.name))
        .map((entry) => path.join(folder, entry.name))
        .sort();
    } catch (err) {
      found.skipped.push({ source: folder, reason: `the folder could not be read: ${err.message}` });
      return [];
    }
  }

  static extOf(bytes) {
    if (TrainingImageSources._startsWith(bytes, TrainingImageSources.PNG_MAGIC)) return 'png';
    if (TrainingImageSources._startsWith(bytes, TrainingImageSources.JPEG_MAGIC)) return 'jpg';
    return null;
  }

  static _startsWith(bytes, magic) {
    return !!bytes && bytes.length >= magic.length && magic.every((value, index) => bytes[index] === value);
  }
}

module.exports = TrainingImageSources;
