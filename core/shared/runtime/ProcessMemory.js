const { execFile, execFileSync } = require('child_process');

class ProcessMemory {
  static TIMEOUT_MS = 8000;

  static rssBytes(pid) {
    if (!pid) return Promise.resolve(null);
    const { cmd, args } = ProcessMemory._commandFor(pid);
    return new Promise((resolve) => {
      execFile(cmd, args, ProcessMemory._execOptions(), (err, stdout) => {
        resolve(err ? null : ProcessMemory._bytesFromOutput(stdout, pid));
      });
    });
  }

  static rssBytesSync(pid) {
    if (!pid) return null;
    const { cmd, args } = ProcessMemory._commandFor(pid);
    try {
      return ProcessMemory._bytesFromOutput(execFileSync(cmd, args, ProcessMemory._execOptions()), pid);
    } catch (_) {
      return null;
    }
  }

  static parseTasklistCsvKb(stdout, pid) {
    const row = String(stdout || '').split(/\r?\n/).find((line) => line.includes(`"${pid}"`));
    if (!row) return null;
    const columns = row.split('","').map((cell) => cell.replace(/^"|"$/g, ''));
    return ProcessMemory._positiveOrNull(Number((columns[columns.length - 1] || '').replace(/[^\d]/g, '')));
  }

  static parsePsRssKb(stdout) {
    return ProcessMemory._positiveOrNull(Number(String(stdout == null ? '' : stdout).trim()));
  }

  static _isWindows() {
    return process.platform === 'win32';
  }

  static _commandFor(pid) {
    if (ProcessMemory._isWindows()) {
      return { cmd: 'tasklist', args: ['/FI', `PID eq ${pid}`, '/NH', '/FO', 'CSV'] };
    }
    return { cmd: 'ps', args: ['-o', 'rss=', '-p', String(pid)] };
  }

  static _execOptions() {
    return { timeout: ProcessMemory.TIMEOUT_MS, encoding: 'utf8' };
  }

  static _bytesFromOutput(stdout, pid) {
    const kb = ProcessMemory._isWindows()
      ? ProcessMemory.parseTasklistCsvKb(stdout, pid)
      : ProcessMemory.parsePsRssKb(stdout);
    return kb == null ? null : kb * 1024;
  }

  static _positiveOrNull(kb) {
    return Number.isFinite(kb) && kb > 0 ? kb : null;
  }
}

module.exports = ProcessMemory;
