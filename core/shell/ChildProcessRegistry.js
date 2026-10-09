const childProcess = require('child_process');

class ChildProcessRegistry {
  static _children = new Set();

  static track(child) {
    if (!ChildProcessRegistry._hasPid(child)) return child;
    ChildProcessRegistry._children.add(child);
    ChildProcessRegistry._dropOnExit(child);
    return child;
  }

  static pids() {
    const alive = [...ChildProcessRegistry._children].filter(ChildProcessRegistry._isAlive);
    return alive.map((child) => child.pid);
  }

  static killAll({ platform = process.platform, spawn = childProcess.spawn, kill = process.kill, log = console } = {}) {
    const targets = ChildProcessRegistry.pids();
    for (const pid of targets) ChildProcessRegistry._killQuietly(pid, { platform, spawn, kill, log });
    return targets;
  }

  static reset() {
    ChildProcessRegistry._children.clear();
  }

  static _hasPid(child) {
    return !!child && typeof child.pid === 'number';
  }

  static _isAlive(child) {
    return child.exitCode == null && child.signalCode == null && ChildProcessRegistry._hasPid(child);
  }

  static _dropOnExit(child) {
    if (typeof child.once !== 'function') return;
    const drop = () => ChildProcessRegistry._children.delete(child);
    child.once('exit', drop);
    child.once('error', drop);
  }

  static _killQuietly(pid, { platform, spawn, kill, log }) {
    try {
      ChildProcessRegistry._killTree(pid, { platform, spawn, kill });
    } catch (err) {
      try { log.warn(`[children] could not kill pid ${pid}: ${err && err.message}`); } catch (_) {}
    }
  }

  static _killTree(pid, { platform, spawn, kill }) {
    if (platform === 'win32') {
      spawn('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
    } else {
      kill(pid, 'SIGKILL');
    }
  }
}

module.exports = ChildProcessRegistry;
