const fs = require('fs');
const { spawnSync } = require('child_process');

class ZipExtractor {
  static extract(zip, dest, { platform = process.platform, run = spawnSync } = {}) {
    fs.rmSync(dest, { recursive: true, force: true });
    fs.mkdirSync(dest, { recursive: true });
    const r = platform === 'win32'
      ? run('powershell', ['-NoProfile', '-NonInteractive', '-Command', ZipExtractor.expandArchiveCommand(zip, dest)], { stdio: 'inherit' })
      : run('unzip', ['-q', '-o', zip, '-d', dest], { stdio: 'inherit' });
    if (r.status !== 0) throw new Error(platform === 'win32' ? 'Expand-Archive failed' : 'unzip failed');
  }

  static expandArchiveCommand(zip, dest) {
    const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
    return `Expand-Archive -LiteralPath ${q(zip)} -DestinationPath ${q(dest)} -Force`;
  }
}

module.exports = ZipExtractor;
