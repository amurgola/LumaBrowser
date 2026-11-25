const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

class AndroidSdk {
  static ADB_TIMEOUT_MS = 15000;

  constructor(root, { platform = process.platform, execFile = childProcess.execFile, exists = fs.existsSync } = {}) {
    this.root = root;
    this._execFile = execFile;
    this._exists = exists;
    const exe = platform === 'win32' ? '.exe' : '';
    this.emulatorPath = path.join(root, 'emulator', `emulator${exe}`);
    this.adbPath = path.join(root, 'platform-tools', `adb${exe}`);
    this.imagesDir = path.join(root, 'system-images');
  }

  static locate(preferred, { env = process.env, platform = process.platform, home = os.homedir(), exists = fs.existsSync } = {}) {
    const candidates = [preferred, env.ANDROID_HOME, env.ANDROID_SDK_ROOT, AndroidSdk.usualRoot(platform, env, home)];
    for (const root of candidates) {
      if (!root) continue;
      const sdk = new AndroidSdk(root, { platform, exists });
      if (sdk.hasAdb()) return sdk;
    }
    return null;
  }

  static usualRoot(platform, env, home) {
    if (platform === 'win32') return env.LOCALAPPDATA ? path.join(env.LOCALAPPDATA, 'Android', 'Sdk') : '';
    if (platform === 'darwin') return path.join(home, 'Library', 'Android', 'sdk');
    return path.join(home, 'Android', 'Sdk');
  }

  static avdHome({ env = process.env, home = os.homedir() } = {}) {
    return env.ANDROID_AVD_HOME || path.join(home, '.android', 'avd');
  }

  hasAdb() {
    return this._exists(this.adbPath);
  }

  hasEmulator() {
    return this._exists(this.emulatorPath);
  }

  adb(adbArguments, { timeoutMs = AndroidSdk.ADB_TIMEOUT_MS } = {}) {
    return new Promise((resolve) => {
      this._execFile(this.adbPath, adbArguments, { timeout: timeoutMs, windowsHide: true }, (error, stdout) => {
        resolve(error ? '' : String(stdout || '').trim());
      });
    });
  }
}

module.exports = AndroidSdk;
