const { execFile } = require('child_process');

class TarBz2Archive {
  static EXTRACT_TIMEOUT_MS = 10 * 60 * 1000;

  static extract(archivePath, destDir) {
    return new Promise((resolve, reject) => {
      const args = ['-xjf', archivePath, '--strip-components', '1', '-C', destDir];
      execFile('tar', args, { timeout: TarBz2Archive.EXTRACT_TIMEOUT_MS }, (err, _stdout, stderr) => {
        if (err) reject(new Error(`extract failed: ${stderr || err.message}`));
        else resolve();
      });
    });
  }
}

module.exports = TarBz2Archive;
