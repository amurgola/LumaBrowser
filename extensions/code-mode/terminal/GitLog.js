const { execFile } = require('child_process');

class GitLog {
  static TIMEOUT_MS = 4000;
  static MAX_BUFFER = 256 * 1024;

  static run(args, cwd) {
    return new Promise((resolve, reject) => {
      execFile('git', args, { cwd, timeout: GitLog.TIMEOUT_MS, windowsHide: true, maxBuffer: GitLog.MAX_BUFFER }, (err, stdout) => {
        if (err) reject(err);
        else resolve(String(stdout || ''));
      });
    });
  }

  static async recentSubjects(cwd, count, runGit = GitLog.run) {
    if (!cwd) return [];
    try {
      const out = await runGit(['log', '--no-merges', '--format=%s', '-n', String(count)], cwd);
      return String(out || '').split('\n').map((l) => l.trim()).filter(Boolean).slice(0, count);
    } catch (_) {
      return [];
    }
  }
}

module.exports = GitLog;
