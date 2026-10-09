const fs = require('fs');
const path = require('path');
const SysdepsCommandRunner = require('../SysdepsCommandRunner');
const RuntimeInstallError = require('./RuntimeInstallError');

class ArchiveExtractor {
  static EXEC_TIMEOUT_MS = 5 * 60 * 1000;
  static REASON_LIMIT = 500;

  static async extract(archivePath, destDir, { globs = null } = {}) {
    await fs.promises.mkdir(destDir, { recursive: true });
    const isZip = archivePath.toLowerCase().endsWith('.zip');
    const tar = await ArchiveExtractor._run('tar', ArchiveExtractor._tarArgs(archivePath, destDir, globs));
    if (tar.ok) return { method: 'tar' };
    if (!isZip) throw ArchiveExtractor._failure(`Extraction failed (tar exit: ${tar.reason}).`);
    return ArchiveExtractor._extractZipFallbacks(archivePath, destDir, tar);
  }

  static async _extractZipFallbacks(archivePath, destDir, tar) {
    const zip = await ArchiveExtractor._extractZipPureJs(archivePath, destDir);
    if (zip.ok) return { method: 'extract-zip' };
    if (process.platform !== 'win32') {
      throw ArchiveExtractor._failure(`Extraction failed. tar: ${tar.reason}; extract-zip: ${zip.reason}`);
    }
    const ps = await ArchiveExtractor._run('powershell.exe', ArchiveExtractor._expandArchiveArgs(archivePath, destDir));
    if (ps.ok) return { method: 'powershell-expand-archive' };
    throw ArchiveExtractor._failure(`Extraction failed. tar: ${tar.reason}; extract-zip: ${zip.reason}; PowerShell: ${ps.reason}`);
  }

  static _tarArgs(archivePath, destDir, globs) {
    const args = ['-xf', archivePath, '-C', destDir];
    if (globs && globs.length && process.platform === 'linux') args.push('--wildcards', ...globs);
    return args;
  }

  static _expandArchiveArgs(archivePath, destDir) {
    const quote = (p) => p.replace(/'/g, "''");
    return [
      '-NoProfile', '-NonInteractive', '-Command',
      `Expand-Archive -LiteralPath '${quote(archivePath)}' -DestinationPath '${quote(destDir)}' -Force`,
    ];
  }

  static async _extractZipPureJs(archivePath, destDir) {
    let extractZip;
    try { extractZip = require('extract-zip'); } catch (err) { return { ok: false, reason: `extract-zip unavailable: ${err.message}` }; }
    try {
      await extractZip(archivePath, { dir: path.resolve(destDir) });
      return { ok: true };
    } catch (err) {
      return { ok: false, reason: String((err && err.message) || err).slice(0, ArchiveExtractor.REASON_LIMIT) };
    }
  }

  static async _run(cmd, args) {
    const res = await SysdepsCommandRunner.run(cmd, args, { timeout: ArchiveExtractor.EXEC_TIMEOUT_MS });
    if (res.ok) return { ok: true };
    return { ok: false, reason: ArchiveExtractor._reason(cmd, res) };
  }

  static _reason(cmd, res) {
    if (res.code === 'ENOENT') return `${cmd} not found on PATH`;
    return String(res.stderr || `exit ${res.code}`).slice(0, ArchiveExtractor.REASON_LIMIT);
  }

  static _failure(message) {
    return new RuntimeInstallError(message, 'EXTRACT_FAILED');
  }
}

module.exports = ArchiveExtractor;
