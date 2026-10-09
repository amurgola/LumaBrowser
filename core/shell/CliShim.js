const fs = require('fs');
const os = require('os');
const path = require('path');
const LauncherScript = require('./cli-shim/LauncherScript');
const PathEntries = require('./cli-shim/PathEntries');
const WindowsUserPath = require('./cli-shim/WindowsUserPath');

class CliShim {
  static APP_DIR_NAME = 'LumaBrowser';
  static SHIM_NAME_WIN = 'luma.cmd';
  static SHIM_NAME_POSIX = 'luma';
  static CLI_FILES = ['bin', 'lib', 'package.json', 'README.md', 'LICENSE'];
  static VERSION_FILE = '.app-version';
  static LAUNCHER_MODE = 0o755;

  constructor({ exePath, cliSource, version, platform, homeDir, localAppData, fsOps, exec, envPath } = {}) {
    if (!exePath) throw new Error('CliShim requires exePath');
    if (!cliSource) throw new Error('CliShim requires cliSource');
    this.exePath = exePath;
    this.cliSource = cliSource;
    this.version = version || null;
    this.platform = platform || process.platform;
    this.homeDir = homeDir || os.homedir();
    this.localAppData = localAppData || process.env.LOCALAPPDATA || path.join(this.homeDir, 'AppData', 'Local');
    this.fs = fsOps || fs;
    this.envPath = envPath !== undefined ? envPath : (process.env.PATH || '');
    this._userPath = new WindowsUserPath({ exec });
  }

  get isWindows() {
    return this.platform === 'win32';
  }

  shimDir() {
    return this.isWindows
      ? path.join(this.localAppData, CliShim.APP_DIR_NAME, 'bin')
      : path.join(this.homeDir, '.local', 'bin');
  }

  shimPath() {
    return path.join(this.shimDir(), this.isWindows ? CliShim.SHIM_NAME_WIN : CliShim.SHIM_NAME_POSIX);
  }

  cliDir() {
    return this.isWindows
      ? path.join(this.localAppData, CliShim.APP_DIR_NAME, 'cli')
      : path.join(this.homeDir, '.local', 'share', CliShim.APP_DIR_NAME, 'cli');
  }

  cliScript() {
    return path.join(this.cliDir(), 'bin', 'luma.js');
  }

  renderShim() {
    return this.isWindows
      ? LauncherScript.renderWindows(this.exePath, this.cliScript())
      : LauncherScript.renderPosix(this.exePath, this.cliScript());
  }

  async status() {
    const content = this._readLauncher();
    const installed = content !== null;
    const current = installed && content === this.renderShim();
    const onPath = await this._isOnPath();
    return {
      installed,
      current,
      onPath,
      shimPath: this.shimPath(),
      cliDir: this.cliDir(),
      cliVersion: this._copiedVersion(),
      note: this._statusNote(installed, current, onPath),
    };
  }

  async install() {
    this._copyCli();
    this._writeLauncher();
    const pathChanged = this.isWindows ? await this._userPath.add(this.shimDir()) : false;
    return { ...(await this.status()), pathChanged };
  }

  async uninstall() {
    this._removeQuietly(this.shimPath(), { force: true });
    this._removeQuietly(this.cliDir(), { recursive: true, force: true });
    const pathChanged = this.isWindows ? await this._removeFromUserPath() : false;
    return { ...(await this.status()), pathChanged };
  }

  async refreshIfInstalled() {
    try {
      const content = this._readLauncher();
      if (content === null || !this._isStale(content)) return false;
      this._copyCli();
      this.fs.writeFileSync(this.shimPath(), this.renderShim(), { mode: CliShim.LAUNCHER_MODE });
      return true;
    } catch (_) {
      return false;
    }
  }

  _isStale(content) {
    if (content !== this.renderShim()) return true;
    return !!this.version && this._copiedVersion() !== this.version;
  }

  _statusNote(installed, current, onPath) {
    if (!installed) return '';
    if (!onPath) {
      return this.isWindows ? 'The launcher folder is not on your PATH yet.' : `Add ${this.shimDir()} to your PATH to use it.`;
    }
    if (!current) return 'The launcher points at an older LumaBrowser; it will be refreshed on the next start.';
    return 'Open a new terminal and type luma.';
  }

  _readLauncher() {
    try { return String(this.fs.readFileSync(this.shimPath(), 'utf8')); } catch (_) { return null; }
  }

  _writeLauncher() {
    this.fs.mkdirSync(this.shimDir(), { recursive: true });
    this.fs.writeFileSync(this.shimPath(), this.renderShim(), { mode: CliShim.LAUNCHER_MODE });
    if (!this.isWindows) {
      try { this.fs.chmodSync(this.shimPath(), CliShim.LAUNCHER_MODE); } catch (_) {}
    }
  }

  _copyCli() {
    const dest = this.cliDir();
    this.fs.rmSync(dest, { recursive: true, force: true });
    this.fs.mkdirSync(dest, { recursive: true });
    for (const name of CliShim.CLI_FILES) {
      const from = path.join(this.cliSource, name);
      if (this.fs.existsSync(from)) this.fs.cpSync(from, path.join(dest, name), { recursive: true });
    }
    if (this.version) this.fs.writeFileSync(path.join(dest, CliShim.VERSION_FILE), String(this.version));
  }

  _copiedVersion() {
    try { return String(this.fs.readFileSync(path.join(this.cliDir(), CliShim.VERSION_FILE), 'utf8')).trim() || null; }
    catch (_) { return null; }
  }

  async _isOnPath() {
    const dir = this.shimDir();
    if (!this.isWindows) return PathEntries.includes(this.envPath, dir, this._envPathDelimiter());
    try {
      return PathEntries.includes(await this._userPath.read(), dir);
    } catch (_) {
      return PathEntries.includes(this.envPath, dir);
    }
  }

  _envPathDelimiter() {
    return this.envPath.includes(path.delimiter) ? path.delimiter : ':';
  }

  async _removeFromUserPath() {
    try { return await this._userPath.remove(this.shimDir()); } catch (_) { return false; }
  }

  _removeQuietly(target, options) {
    try { this.fs.rmSync(target, options); } catch (_) {}
  }
}

module.exports = CliShim;
