const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

class ZipExtractor {
  static extract(zip, dest, { platform = process.platform, run = spawnSync, env = process.env, exists = fs.existsSync } = {}) {
    fs.rmSync(dest, { recursive: true, force: true });
    fs.mkdirSync(dest, { recursive: true });
    const [cmd, args, label] = ZipExtractor.command(zip, dest, { platform, env, exists });
    const r = run(cmd, args, { stdio: 'inherit' });
    if (r.status !== 0) throw new Error(`${label} failed`);
  }

  static command(zip, dest, { platform = process.platform, env = process.env, exists = fs.existsSync } = {}) {
    if (platform !== 'win32') return ['unzip', ['-q', '-o', zip, '-d', dest], 'unzip'];
    const tar = path.win32.join(env.SystemRoot || 'C:\Windows', 'System32', 'tar.exe');
    if (exists(tar)) return [tar, ['-xf', zip, '-C', dest], 'tar'];
    return ['powershell', ['-NoProfile', '-NonInteractive', '-Command', ZipExtractor.expandArchiveCommand(zip, dest)], 'Expand-Archive'];
  }

  static expandArchiveCommand(zip, dest) {
    const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
    return `Expand-Archive -LiteralPath ${q(zip)} -DestinationPath ${q(dest)} -Force`;
  }
}

module.exports = ZipExtractor;
