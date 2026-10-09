const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class RuntimeImageIndex {
  static FILE = path.join('.gamedata', 'images.json');

  static requestHash(params) {
    const h = crypto.createHash('sha1');
    h.update(JSON.stringify([params.prompt, params.width, params.height, params.style || '', !!params.transparent]));
    return h.digest('hex').slice(0, 16);
  }

  static read(gameDir) {
    try {
      return JSON.parse(fs.readFileSync(path.join(gameDir, RuntimeImageIndex.FILE), 'utf8')) || {};
    } catch (_) { return {}; }
  }

  static write(gameDir, index) {
    const file = path.join(gameDir, RuntimeImageIndex.FILE);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(index), 'utf8');
  }
}

module.exports = RuntimeImageIndex;
