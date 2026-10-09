const childProcess = require('child_process');

class SdServerCapabilities {
  static HELP_TIMEOUT_MS = 15000;
  static HELP_MAX_BUFFER = 4 * 1024 * 1024;
  static AUTO_FIT_VALUED = /--auto-fit[^\n]{0,120}on\|off/;

  static _sharedCache = new Map();

  constructor({ execFile = childProcess.execFile, cache = SdServerCapabilities._sharedCache } = {}) {
    this._execFile = execFile;
    this._cache = cache;
  }

  async supportsFlag(binaryPath, flag) {
    if (!binaryPath || !flag) return false;
    return (await this.helpText(binaryPath)).includes(flag);
  }

  async autoFitFlagForm(binaryPath) {
    return SdServerCapabilities.AUTO_FIT_VALUED.test(await this.helpText(binaryPath)) ? 'valued' : 'bare';
  }

  helpText(binaryPath) {
    if (!this._cache.has(binaryPath)) this._cache.set(binaryPath, this._readHelp(binaryPath));
    return this._cache.get(binaryPath);
  }

  _readHelp(binaryPath) {
    return new Promise((resolve) => {
      try {
        this._execFile(binaryPath, ['--help'], {
          timeout: SdServerCapabilities.HELP_TIMEOUT_MS,
          windowsHide: true,
          maxBuffer: SdServerCapabilities.HELP_MAX_BUFFER,
        }, (_err, stdout, stderr) => resolve(`${stdout || ''}\n${stderr || ''}`));
      } catch (_) {
        resolve('');
      }
    });
  }
}

module.exports = SdServerCapabilities;
