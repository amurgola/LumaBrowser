const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class AppLauncher {
  static READY_ATTEMPTS = 30;
  static READY_INTERVAL_MS = 1000;

  constructor({ shellDir, isRunning, platform = process.platform, spawnFn = spawn, wait = AppLauncher._sleep }) {
    this._shellDir = shellDir;
    this._isRunning = isRunning;
    this._platform = platform;
    this._spawn = spawnFn;
    this._wait = wait;
    this.process = null;
    this.autoStarted = false;
  }

  async start() {
    const { command, args } = this.resolveCommand();
    console.error('Starting Electron app in headless mode...');
    this._launch(command, args);
    await this._waitUntilReady();
  }

  stop() {
    if (!this.process || !this.autoStarted) return;
    console.error('Stopping auto-started Electron app...');
    this.process.kill();
    this._forget();
  }

  resolveCommand() {
    if (this._shellDir.includes('app.asar.unpacked')) return { command: this._installedBinary(), args: [] };
    return { command: require('electron'), args: [path.join(this._shellDir, '..', '..')] };
  }

  _installedBinary() {
    const resourcesDir = path.join(this._shellDir, '..', '..', '..');
    const appDir = path.join(resourcesDir, '..');
    if (this._platform === 'win32') return path.join(appDir, 'LumaBrowser.exe');
    if (this._platform === 'darwin') return path.join(resourcesDir, '..', 'MacOS', 'LumaBrowser');
    const lower = path.join(appDir, 'lumabrowser');
    return fs.existsSync(lower) ? lower : path.join(appDir, 'LumaBrowser');
  }

  _launch(command, args) {
    this.process = this._spawn(command, args, {
      stdio: 'ignore',
      detached: false,
      env: { ...process.env, ELECTRON_ENABLE_LOGGING: '0', ELECTRON_NO_ATTACH_CONSOLE: '1' },
    });
    this.autoStarted = true;
    this.process.on('error', (error) => {
      console.error('Failed to start Electron app:', error);
      this._forget();
    });
    this.process.on('exit', (code, signal) => {
      if (this.autoStarted) console.error(`Electron app exited with code ${code} and signal ${signal}`);
      this._forget();
    });
  }

  async _waitUntilReady() {
    for (let i = 0; i < AppLauncher.READY_ATTEMPTS; i++) {
      await this._wait(AppLauncher.READY_INTERVAL_MS);
      if (await this._isRunning()) {
        console.error('Electron app is ready!');
        return;
      }
    }
    throw new Error('Electron app failed to start within 30 seconds');
  }

  _forget() {
    this.process = null;
    this.autoStarted = false;
  }

  static _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = AppLauncher;
