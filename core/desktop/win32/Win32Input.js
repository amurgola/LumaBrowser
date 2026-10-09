const Win32Api = require('./Win32Api');

class Win32Input {
  static INPUT_SIZE = 40;
  static INPUT_MOUSE = 0;
  static INPUT_KEYBOARD = 1;
  static MOUSEEVENTF = {
    LEFTDOWN: 0x02, LEFTUP: 0x04, RIGHTDOWN: 0x08, RIGHTUP: 0x10, MIDDLEDOWN: 0x20, MIDDLEUP: 0x40,
    WHEEL: 0x0800, HWHEEL: 0x1000,
  };
  static KEYEVENTF = { EXTENDEDKEY: 0x1, KEYUP: 0x2, UNICODE: 0x4 };
  static KEYEVENTF_SCANCODE = 0x0008;
  static MOUSEEVENTF_MOVE = 0x0001;

  static mouseInput(flags, mouseData = 0) {
    return Win32Input._mouseRecord(0, 0, mouseData, flags);
  }

  static keyInput({ vk = 0, scan = 0, flags = 0 }) {
    const b = Buffer.alloc(Win32Input.INPUT_SIZE);
    b.writeUInt32LE(Win32Input.INPUT_KEYBOARD, 0);
    b.writeUInt16LE(vk, 8);
    b.writeUInt16LE(scan, 10);
    b.writeUInt32LE(flags, 12);
    return b;
  }

  static keyInputScan({ scan, up = false, extended = false }) {
    const K = Win32Input.KEYEVENTF;
    const flags = Win32Input.KEYEVENTF_SCANCODE | (up ? K.KEYUP : 0) | (extended ? K.EXTENDEDKEY : 0);
    return Win32Input.keyInput({ vk: 0, scan: scan & 0xffff, flags });
  }

  static relativeMoveInput(dx, dy) {
    return Win32Input._mouseRecord(Math.round(dx), Math.round(dy), 0, Win32Input.MOUSEEVENTF_MOVE);
  }

  static sendInputs(inputs) {
    if (!inputs.length) return 0;
    const sent = Win32Api.load().SendInput(inputs.length, Buffer.concat(inputs), Win32Input.INPUT_SIZE);
    if (sent !== inputs.length) {
      throw new Error(`SendInput delivered ${sent}/${inputs.length} events (blocked by UIPI or the secure desktop)`);
    }
    return sent;
  }

  static altTap() {
    const ALT = 0x12;
    return [Win32Input.keyInput({ vk: ALT }), Win32Input.keyInput({ vk: ALT, flags: Win32Input.KEYEVENTF.KEYUP })];
  }

  static _mouseRecord(dx, dy, mouseData, flags) {
    const b = Buffer.alloc(Win32Input.INPUT_SIZE);
    b.writeUInt32LE(Win32Input.INPUT_MOUSE, 0);
    b.writeInt32LE(dx, 8);
    b.writeInt32LE(dy, 12);
    b.writeInt32LE(mouseData, 16);
    b.writeUInt32LE(flags, 20);
    return b;
  }
}

module.exports = Win32Input;
