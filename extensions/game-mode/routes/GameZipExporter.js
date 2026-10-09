const fs = require('fs');
const path = require('path');
const CoreRequire = require('../CoreRequire');
const GameJson = require('../session/GameJson');

const Slug = CoreRequire.load('shared/text/Slug');

class GameZipExporter {
  static ENGINE_TAG = /["'][^"']*\/lib\/phaser\/phaser\.min\.js["']/i;

  static fileName(root) {
    return `${Slug.from(GameJson.nameOf(root) || '', { fallback: 'game' })}.zip`;
  }

  static stream({ root, phaserPath, output, onError }) {
    const archive = require('archiver')('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => onError(err));
    archive.pipe(output);
    GameZipExporter._addFolder(archive, root, '');
    archive.file(phaserPath, { name: 'phaser.min.js' });
    archive.finalize();
    return archive;
  }

  static _addFolder(archive, dir, relBase) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      const rel = relBase ? `${relBase}/${entry.name}` : entry.name;
      if (entry.isDirectory()) GameZipExporter._addFolder(archive, abs, rel);
      else if (rel === 'index.html') archive.append(GameZipExporter._portableIndex(abs), { name: rel });
      else archive.file(abs, { name: rel });
    }
  }

  static _portableIndex(abs) {
    return fs.readFileSync(abs, 'utf8').replace(GameZipExporter.ENGINE_TAG, '"phaser.min.js"');
  }
}

module.exports = GameZipExporter;
