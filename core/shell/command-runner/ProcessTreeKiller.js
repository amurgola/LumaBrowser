class ProcessTreeKiller {
  constructor({ platform, spawn }) {
    this._platform = platform;
    this._spawn = spawn;
  }

  kill(child) {
    if (!child || !child.pid) return;
    try {
      if (this._platform === 'win32') this._taskkill(child.pid);
      else ProcessTreeKiller._killGroup(child);
    } catch (_) {
      ProcessTreeKiller._killChild(child);
    }
  }

  _taskkill(pid) {
    this._spawn('taskkill', ['/pid', String(pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
  }

  static _killGroup(child) {
    try { process.kill(-child.pid, 'SIGKILL'); } catch (_) { child.kill('SIGKILL'); }
  }

  static _killChild(child) {
    try { child.kill('SIGKILL'); } catch (_) {}
  }
}

module.exports = ProcessTreeKiller;
