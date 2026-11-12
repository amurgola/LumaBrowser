const os = require('os');
const path = require('path');

class UserDataLocator {
  static resolve({ env = process.env, platform = process.platform, home = os.homedir(), appName }) {
    if (env.LUMA_DATA_DIR) return env.LUMA_DATA_DIR;
    if (platform === 'win32') return path.join(env.APPDATA || path.join(home, 'AppData', 'Roaming'), appName);
    if (platform === 'darwin') return path.join(home, 'Library', 'Application Support', appName);
    return path.join(env.XDG_CONFIG_HOME || path.join(home, '.config'), appName);
  }

  static isIsolated(env = process.env) {
    return Boolean(env.LUMA_DATA_DIR);
  }
}

module.exports = UserDataLocator;
