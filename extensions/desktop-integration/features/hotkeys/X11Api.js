class X11Api {
  static KEYSYMS = {
    Shift_L: 0xffe1, Shift_R: 0xffe2, Control_L: 0xffe3, Control_R: 0xffe4,
    Alt_L: 0xffe9, Alt_R: 0xffea, Super_L: 0xffeb, Super_R: 0xffec, c: 0x63, v: 0x76,
  };
  static REVERT_TO_PARENT = 2;
  static _api = null;

  static load() {
    if (X11Api._api) return X11Api._api;
    if (process.platform !== 'linux') throw new Error('X11 bindings are Linux-only');
    X11Api._api = X11Api._bind(require('koffi'));
    return X11Api._api;
  }

  static _bind(koffi) {
    const x11 = koffi.load('libX11.so.6');
    const xtst = koffi.load('libXtst.so.6');
    const f = {
      open: x11.func('XOpenDisplay', 'void *', ['const char *']),
      queryKeymap: x11.func('XQueryKeymap', 'int', ['void *', 'void *']),
      keysymToKeycode: x11.func('XKeysymToKeycode', 'uint8_t', ['void *', 'unsigned long']),
      getInputFocus: x11.func('XGetInputFocus', 'int', ['void *', 'void *', 'void *']),
      setInputFocus: x11.func('XSetInputFocus', 'int', ['void *', 'unsigned long', 'int', 'unsigned long']),
      raise: x11.func('XRaiseWindow', 'int', ['void *', 'unsigned long']),
      flush: x11.func('XFlush', 'int', ['void *']),
      fakeKey: xtst.func('XTestFakeKeyEvent', 'int', ['void *', 'unsigned int', 'int', 'unsigned long']),
    };
    const display = f.open(null);
    if (!display) throw new Error('Cannot open the X display');
    const keycode = (name) => f.keysymToKeycode(display, X11Api.KEYSYMS[name]);
    return {
      keycode,
      keycodeOf: (keysym) => f.keysymToKeycode(display, keysym),
      keysDown: () => {
        const map = Buffer.alloc(32);
        f.queryKeymap(display, map);
        return (code) => code > 0 && (map[code >> 3] & (1 << (code & 7))) !== 0;
      },
      key: (code, down) => f.fakeKey(display, code, down ? 1 : 0, 0),
      flush: () => f.flush(display),
      focusedWindow: () => {
        const win = Buffer.alloc(8);
        const revert = Buffer.alloc(4);
        f.getInputFocus(display, win, revert);
        return Number(win.readBigUInt64LE(0));
      },
      focus: (win) => {
        f.raise(display, win);
        f.setInputFocus(display, win, X11Api.REVERT_TO_PARENT, 0);
        f.flush(display);
      },
    };
  }
}

module.exports = X11Api;
