const childProcess = require('child_process');

class ChildProcessRegistry {
  static _children = new Set();
  static _adopted = new Map();

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

  static adopt(owner, descendants) {
    if (!owner || !Array.isArray(descendants) || !descendants.length) return;
    ChildProcessRegistry._adopted.set(owner, descendants.slice());
  }

  static release(owner) {
    ChildProcessRegistry._adopted.delete(owner);
  }

  static killAll({ platform = process.platform, spawn = childProcess.spawn, kill = process.kill, log = console } = {}) {
    const targets = ChildProcessRegistry.pids();
    for (const pid of targets) ChildProcessRegistry._killQuietly(pid, { platform, spawn, kill, log });
    for (const descendants of ChildProcessRegistry._adopted.values()) {
      for (const { pid, name } of descendants) {
        try { ChildProcessRegistry.killTreeNamed(pid, name, { platform, spawn }); } catch (_) {}
      }
    }
    return targets;
  }

  static reset() {
    ChildProcessRegistry._children.clear();
    ChildProcessRegistry._adopted.clear();
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
      ChildProcessRegistry.killTree(pid, { platform, spawn, kill });
    } catch (err) {
      try { log.warn(`[children] could not kill pid ${pid}: ${err && err.message}`); } catch (_) {}
    }
  }

  static killTreeNamed(pid, name, { platform = process.platform, spawn = childProcess.spawn } = {}) {
    if (platform !== 'win32' || !Number.isInteger(pid) || !name) return;
    spawn('taskkill', ['/F', '/T', '/FI', `PID eq ${pid}`, '/FI', `IMAGENAME eq ${name}`], { windowsHide: true, stdio: 'ignore' });
  }

  static killTree(pid, { platform = process.platform, spawn = childProcess.spawn, kill = process.kill } = {}) {
    if (platform === 'win32') {
      spawn('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
    } else {
      kill(pid, 'SIGKILL');
    }
  }
}

module.exports = ChildProcessRegistry;
