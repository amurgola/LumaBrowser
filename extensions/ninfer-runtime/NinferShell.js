const { spawn } = require('child_process');
const CoreRequire = require('./CoreRequire');

const Wsl = CoreRequire.load('music-server/runtimes/Wsl');

class NinferShell {
  static PROBE_TIMEOUT_MS = 20000;
  static WSL_EXE = 'C:\\Windows\\System32\\wsl.exe';

  static currentMode(platform = process.platform) {
    return platform === 'win32' ? 'wsl' : 'native';
  }

  static spawnArgs(mode, distro, cmd) {
    if (mode === 'wsl') return [NinferShell.WSL_EXE, [...(distro ? ['-d', distro] : []), '--', 'bash', '-lc', cmd]];
    return ['bash', ['-lc', cmd]];
  }

  static run(mode, distro, cmd, { timeout = NinferShell.PROBE_TIMEOUT_MS } = {}) {
    if (mode === 'wsl') return Wsl.runInWsl(distro, cmd, { timeout });
    return NinferShell._runLocal(cmd, timeout);
  }

  static _runLocal(cmd, timeout) {
    return new Promise((resolve) => {
      const child = spawn('bash', ['-lc', cmd], { stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';
      let settled = false;
      const finish = (res) => {
        if (settled) return;
        settled = true;
        clearTimeout(killer);
        resolve(res);
      };
      const killer = setTimeout(() => {
        try { child.kill(); } catch (_) {}
        finish({ ok: false, stdout, stderr: `${stderr}\ntimed out` });
      }, timeout);
      child.stdout.on('data', (c) => { stdout += c.toString('utf8'); });
      child.stderr.on('data', (c) => { stderr += c.toString('utf8'); });
      child.on('error', (err) => finish({ ok: false, stdout, stderr: err.message }));
      child.on('exit', (code) => finish({ ok: code === 0, stdout, stderr }));
    });
  }
}

module.exports = NinferShell;
