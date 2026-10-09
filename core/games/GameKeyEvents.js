const DesktopKeys = require('../desktop/DesktopKeys');

class GameKeyEvents {
  static forKey(win, vk, mode) {
    return mode === 'vk' ? GameKeyEvents._virtualKey(win, vk) : GameKeyEvents._scanCode(win, vk);
  }

  static _virtualKey(win, vk) {
    const K = win.KEYEVENTF;
    const ext = DesktopKeys.EXTENDED.has(vk) ? K.EXTENDEDKEY : 0;
    return { down: win.keyInput({ vk, flags: ext }), up: win.keyInput({ vk, flags: ext | K.KEYUP }) };
  }

  static _scanCode(win, vk) {
    const sc = win.scanCodeFor(vk);
    if (!sc) throw new Error(`No scan code for virtual key 0x${vk.toString(16)} on this keyboard layout; try mode "vk".`);
    return {
      down: win.keyInputScan({ scan: sc.scan, extended: sc.extended }),
      up: win.keyInputScan({ scan: sc.scan, extended: sc.extended, up: true }),
    };
  }
}

module.exports = GameKeyEvents;
