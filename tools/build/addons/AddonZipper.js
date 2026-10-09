const fs = require('fs');

class AddonZipper {
  constructor({ archiver = require('archiver') } = {}) {
    this._archiver = archiver;
  }

  zip(srcDir, topFolder, destZip) {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(destZip);
      const archive = this._archiver('zip', { zlib: { level: 9 } });
      output.on('close', () => resolve(archive.pointer()));
      archive.on('error', reject);
      archive.pipe(output);
      archive.directory(srcDir, topFolder);
      archive.finalize();
    });
  }
}

module.exports = AddonZipper;
