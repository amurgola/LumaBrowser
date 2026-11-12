const { spawnSync } = require('child_process');

class ProcessTreeKiller {
  static spawnOptions(platform = process.platform) {
    return platform === 'win32' ? {} : { detached: true };
  }

  static kill(child, { platform = process.platform, run = spawnSync, signal = process.kill } = {}) {
    if (!child || !Number.isInteger(child.pid)) return false;
    if (platform === 'win32') return ProcessTreeKiller._killWindowsTree(child.pid, run);
    return ProcessTreeKiller._killGroup(child, signal);
  }

  static _killWindowsTree(pid, run) {
    const result = run('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
    return Boolean(result) && result.status === 0;
  }

  static _killGroup(child, signal) {
    try { signal(-child.pid, 'SIGKILL'); return true; } catch (_) {}
    try { return child.kill('SIGKILL'); } catch (_) { return false; }
  }
}

module.exports = ProcessTreeKiller;
