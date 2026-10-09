const path = require('path');
const { execFile } = require('child_process');

class VersionProbe {
  static TIMEOUT_MS = 4000;
  static MAX_BUFFER_BYTES = 256 * 1024;
  static ERROR_LIMIT = 200;

  static read(binaryPath, parse) {
    return new Promise((resolve) => {
      let settled = false;
      const settle = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      const child = execFile(binaryPath, ['--version'], VersionProbe._execOptions(binaryPath), (err, stdout, stderr) => {
        settle(err ? VersionProbe._failed(err, stderr) : VersionProbe._parsed(parse, stdout, stderr));
      });
      child.on('error', (err) => settle(VersionProbe._failed(err, '')));
    });
  }

  static normalize(result) {
    if (result && typeof result === 'object' && !Array.isArray(result)) {
      return { version: result.version == null ? null : String(result.version), probeError: result.probeError || null };
    }
    return { version: result == null ? null : String(result), probeError: null };
  }

  static describeFailure(err, stderr) {
    if (err && err.code === 'ENOENT') return 'binary not found';
    if (err && err.killed) return 'version probe timed out';
    const text = String(stderr || '').trim() || String((err && err.message) || 'version probe failed');
    const first = text.split(/\r?\n/).find((l) => l.trim()) || text;
    const exit = err && Number.isInteger(err.code) ? ` (exit ${err.code})` : '';
    return (first.trim().slice(0, VersionProbe.ERROR_LIMIT) + exit) || 'version probe failed';
  }

  static _execOptions(binaryPath) {
    const binDir = path.dirname(binaryPath);
    const env = { ...process.env };
    if (process.platform === 'linux') env.LD_LIBRARY_PATH = env.LD_LIBRARY_PATH ? `${binDir}:${env.LD_LIBRARY_PATH}` : binDir;
    return { windowsHide: true, timeout: VersionProbe.TIMEOUT_MS, maxBuffer: VersionProbe.MAX_BUFFER_BYTES, cwd: binDir, env };
  }

  static _failed(err, stderr) {
    return { version: null, probeError: VersionProbe.describeFailure(err, stderr) };
  }

  static _parsed(parse, stdout, stderr) {
    try {
      return { version: parse(stdout || '', stderr || '') || null, probeError: null };
    } catch (_) {
      return { version: null, probeError: 'version output could not be parsed' };
    }
  }
}

module.exports = VersionProbe;
