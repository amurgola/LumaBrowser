class WinEvents {
  static EVENT_SYSTEM_FOREGROUND = 0x0003;
  static EVENT_SYSTEM_MINIMIZESTART = 0x0016;
  static EVENT_SYSTEM_MINIMIZEEND = 0x0017;
  static EVENT_OBJECT_LOCATIONCHANGE = 0x800B;
  static WINEVENT_OUTOFCONTEXT = 0x0000;
  static WINEVENT_SKIPOWNPROCESS = 0x0002;
  static OBJID_WINDOW = 0;
  static GW_HWNDPREV = 3;
  static GWL_EXSTYLE = -20;
  static WS_EX_TOPMOST = 0x0008;
  static HWND_TOP = 0;
  static SWP = { NOSIZE: 0x0001, NOMOVE: 0x0002, NOACTIVATE: 0x0010, NOOWNERZORDER: 0x0200 };

  constructor({ loadApi = () => require('../../../../core/desktop/win32/Win32Api').load() } = {}) {
    this._loadApi = loadApi;
    this._fns = null;
    this._callbacks = new Set();
  }

  get supported() {
    try { return !!this._bind(); } catch (_) { return false; }
  }

  watchLocation(pid, cb) {
    return this._hook(WinEvents.EVENT_OBJECT_LOCATIONCHANGE, WinEvents.EVENT_OBJECT_LOCATIONCHANGE, pid, (event, hwnd, idObject, idChild) => {
      if (idObject === WinEvents.OBJID_WINDOW && idChild === 0 && hwnd) cb(hwnd);
    });
  }

  watchSystem(cb) {
    const stops = [
      this._hook(WinEvents.EVENT_SYSTEM_FOREGROUND, WinEvents.EVENT_SYSTEM_FOREGROUND, 0, (event, hwnd) => cb(event, hwnd)),
      this._hook(WinEvents.EVENT_SYSTEM_MINIMIZESTART, WinEvents.EVENT_SYSTEM_MINIMIZEEND, 0, (event, hwnd) => cb(event, hwnd)),
    ];
    return () => stops.forEach((s) => s());
  }

  placeAbove(own, target) {
    const f = this._bind();
    let after = Number(f.GetWindow(target, WinEvents.GW_HWNDPREV)) || 0;
    if (after === own) return true;
    if (after && (Number(this._loadApi().GetWindowLongPtrW(after, WinEvents.GWL_EXSTYLE)) & WinEvents.WS_EX_TOPMOST)) after = WinEvents.HWND_TOP;
    const flags = WinEvents.SWP.NOSIZE | WinEvents.SWP.NOMOVE | WinEvents.SWP.NOACTIVATE | WinEvents.SWP.NOOWNERZORDER;
    return !!f.SetWindowPos(own, after || WinEvents.HWND_TOP, 0, 0, 0, 0, flags);
  }

  dispose() {
    for (const stop of [...this._callbacks]) stop();
  }

  _hook(min, max, pid, handler) {
    const f = this._bind();
    const koffi = f.koffi;
    const cb = koffi.register((hook, event, hwnd, idObject, idChild) => {
      try { handler(event, Number(hwnd) || 0, idObject, idChild); } catch (_) {}
    }, koffi.pointer(f.WINEVENTPROC));
    const handle = f.SetWinEventHook(min, max, 0, cb, pid >>> 0, 0, WinEvents.WINEVENT_OUTOFCONTEXT | WinEvents.WINEVENT_SKIPOWNPROCESS);
    if (!handle) {
      koffi.unregister(cb);
      throw new Error('SetWinEventHook failed');
    }
    let done = false;
    const stop = () => {
      if (done) return;
      done = true;
      this._callbacks.delete(stop);
      try { f.UnhookWinEvent(handle); } catch (_) {}
      try { koffi.unregister(cb); } catch (_) {}
    };
    this._callbacks.add(stop);
    return stop;
  }

  _bind() {
    if (this._fns) return this._fns;
    const api = this._loadApi();
    const koffi = api.koffi;
    const user32 = koffi.load('user32.dll');
    const WINEVENTPROC = koffi.proto('void __stdcall LumabyteWinEventProc(intptr_t hook, uint32_t event, intptr_t hwnd, long idObject, long idChild, uint32_t thread, uint32_t time)');
    this._fns = {
      koffi,
      WINEVENTPROC,
      SetWinEventHook: user32.func('__stdcall', 'SetWinEventHook', 'intptr_t', ['uint32_t', 'uint32_t', 'intptr_t', koffi.pointer(WINEVENTPROC), 'uint32_t', 'uint32_t', 'uint32_t']),
      UnhookWinEvent: user32.func('__stdcall', 'UnhookWinEvent', 'bool', ['intptr_t']),
      SetWindowPos: user32.func('__stdcall', 'SetWindowPos', 'bool', ['intptr_t', 'intptr_t', 'int', 'int', 'int', 'int', 'uint32_t']),
      GetWindow: user32.func('__stdcall', 'GetWindow', 'intptr_t', ['intptr_t', 'uint32_t']),
    };
    return this._fns;
  }
}

module.exports = WinEvents;
