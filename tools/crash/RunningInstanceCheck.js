const { execSync } = require('child_process');

class RunningInstanceCheck {
  static IMAGES = ['electron.exe', 'LumaBrowser.exe'];

  static list({ platform = process.platform, exec = RunningInstanceCheck._exec } = {}) {
    return platform === 'win32' ? RunningInstanceCheck._windows(exec) : RunningInstanceCheck._posix(exec);
  }

  static _windows(exec) {
    const out = [];
    for (const image of RunningInstanceCheck.IMAGES) {
      const txt = exec(`tasklist /FI "IMAGENAME eq ${image}" /NH`);
      if (/\.exe/i.test(txt)) out.push(`${image}: ${txt.trim().split('\n').length} process(es)`);
    }
    return out;
  }

  static _posix(exec) {
    return exec('pgrep -fl "electron|LumaBrowser" || true')
      .split('\n').filter((l) => l && !/crash-repro|pgrep/.test(l));
  }

  static _exec(command) {
    try { return execSync(command, { encoding: 'utf8' }); } catch (_) { return ''; }
  }
}

module.exports = RunningInstanceCheck;
