class MacApi {
  static FRAMEWORKS = '/System/Library/Frameworks';
  static COMBINED_STATE = 0;
  static HID_TAP = 0;
  static ACTIVATE_IGNORING_OTHERS = 2;
  static _api = null;

  static load() {
    if (MacApi._api) return MacApi._api;
    if (process.platform !== 'darwin') throw new Error('macOS bindings are macOS-only');
    MacApi._api = MacApi._bind(require('koffi'));
    return MacApi._api;
  }

  static _bind(koffi) {
    const fw = (name) => koffi.load(`${MacApi.FRAMEWORKS}/${name}.framework/${name}`);
    const cg = fw('CoreGraphics');
    const cf = fw('CoreFoundation');
    fw('AppKit');
    const objc = koffi.load('/usr/lib/libobjc.A.dylib');
    const c = {
      flagsState: cg.func('CGEventSourceFlagsState', 'uint64_t', ['int32_t']),
      createKey: cg.func('CGEventCreateKeyboardEvent', 'void *', ['void *', 'uint16_t', 'bool']),
      setFlags: cg.func('CGEventSetFlags', 'void', ['void *', 'uint64_t']),
      post: cg.func('CGEventPost', 'void', ['uint32_t', 'void *']),
      release: cf.func('CFRelease', 'void', ['void *']),
      cls: objc.func('objc_getClass', 'void *', ['const char *']),
      sel: objc.func('sel_registerName', 'void *', ['const char *']),
      sendId: objc.func('objc_msgSend', 'void *', ['void *', 'void *']),
      sendLong: objc.func('objc_msgSend', 'long', ['void *', 'void *']),
      sendInt: objc.func('objc_msgSend', 'int', ['void *', 'void *']),
      sendStr: objc.func('objc_msgSend', 'const char *', ['void *', 'void *']),
      sendIdInt: objc.func('objc_msgSend', 'void *', ['void *', 'void *', 'int']),
      sendBoolULong: objc.func('objc_msgSend', 'bool', ['void *', 'void *', 'unsigned long']),
    };
    const msg = (target, name) => c.sendId(target, c.sel(name));
    const appFor = (pid) => c.sendIdInt(c.cls('NSRunningApplication'), c.sel('runningApplicationWithProcessIdentifier:'), pid);
    return {
      flagsState: () => Number(c.flagsState(MacApi.COMBINED_STATE)),
      postKey: (keyCode, down, flags) => {
        const ev = c.createKey(null, keyCode, down);
        if (!ev) throw new Error('CGEventCreateKeyboardEvent failed');
        try {
          c.setFlags(ev, flags);
          c.post(MacApi.HID_TAP, ev);
        } finally {
          c.release(ev);
        }
      },
      changeCount: () => Number(c.sendLong(msg(c.cls('NSPasteboard'), 'generalPasteboard'), c.sel('changeCount'))),
      frontmostPid: () => {
        const app = msg(msg(c.cls('NSWorkspace'), 'sharedWorkspace'), 'frontmostApplication');
        return app ? c.sendInt(app, c.sel('processIdentifier')) : 0;
      },
      activate: (pid) => {
        const app = appFor(pid);
        return !!app && !!c.sendBoolULong(app, c.sel('activateWithOptions:'), MacApi.ACTIVATE_IGNORING_OTHERS);
      },
      appName: (pid) => {
        const app = appFor(pid);
        const name = app ? msg(app, 'localizedName') : null;
        return name ? String(c.sendStr(name, c.sel('UTF8String')) || '') : '';
      },
    };
  }
}

module.exports = MacApi;
