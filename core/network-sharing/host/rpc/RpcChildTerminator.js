const childProcess = require('child_process');

class RpcChildTerminator {
  static ESCALATE_MS = 3000;
  static VERIFY_MS = 3000;

  static terminate(child, {
    platform = process.platform,
    spawn = childProcess.spawn,
    log = console.error,
  } = {}) {
    try {
      if (!RpcChildTerminator._isAlive(child) || child.killed) return;
      child.kill();
      RpcChildTerminator._later(RpcChildTerminator.ESCALATE_MS, () => RpcChildTerminator._escalate(child, { platform, spawn, log }));
    } catch (_) {}
  }

  static _escalate(child, { platform, spawn, log }) {
    if (!RpcChildTerminator._isAlive(child)) return;
    try { child.kill('SIGKILL'); } catch (_) {}
    if (platform === 'win32' && child.pid) RpcChildTerminator._taskkill(child.pid, spawn);
    RpcChildTerminator._later(RpcChildTerminator.VERIFY_MS, () => RpcChildTerminator._reportSurvivor(child, log));
  }

  static _taskkill(pid, spawn) {
    try {
      spawn('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
    } catch (_) {}
  }

  static _reportSurvivor(child, log) {
    if (!RpcChildTerminator._isAlive(child)) return;
    log(`[sharing] rpc-server pid ${child.pid} SURVIVED teardown. It is still holding the lent VRAM, and future lends will OOM until it is killed manually (Task Manager / taskkill).`);
  }

  static _isAlive(child) {
    return !!child && child.exitCode === null;
  }

  static _later(ms, fn) {
    const timer = setTimeout(fn, ms);
    if (timer.unref) timer.unref();
  }
}

module.exports = RpcChildTerminator;
