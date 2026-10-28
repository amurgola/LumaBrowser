const NativeKeys = require('./NativeKeys');
const MacKeys = require('./MacKeys');
const LinuxKeys = require('./LinuxKeys');

class SelectionKeys {
  static UNSUPPORTED = { supported: false, heldModifiers: () => [] };

  static create({ platform = process.platform, clipboard = null, bridge = null } = {}) {
    if (platform === 'win32') return new NativeKeys({ platform });
    if (platform === 'darwin') return new MacKeys({ platform });
    if (platform === 'linux') return new LinuxKeys({ platform, clipboard, bridge });
    return SelectionKeys.UNSUPPORTED;
  }
}

module.exports = SelectionKeys;
