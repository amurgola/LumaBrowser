const { spawn } = require('child_process');

class InteractionDriver {
  static MIN_SECONDS = 5;
  static STOP_BEFORE_QUIT_MS = 4000;

  constructor({ scriptPath, platform = process.platform, spawnImpl = spawn }) {
    this._script = scriptPath;
    this._platform = platform;
    this._spawn = spawnImpl;
  }

  start(pid, holdMs, write) {
    if (this._platform !== 'win32') return null;
    const child = this._spawn('powershell', this.args(pid, holdMs), { stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', (c) => write(`[interact] ${c}`));
    child.stderr.on('data', (c) => write(`[interact:err] ${c}`));
    child.on('error', () => {});
    return child;
  }

  args(pid, holdMs) {
    const seconds = Math.max(InteractionDriver.MIN_SECONDS, Math.floor((holdMs - InteractionDriver.STOP_BEFORE_QUIT_MS) / 1000));
    return ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', this._script, '-ProcId', String(pid), '-Seconds', String(seconds)];
  }
}

module.exports = InteractionDriver;
