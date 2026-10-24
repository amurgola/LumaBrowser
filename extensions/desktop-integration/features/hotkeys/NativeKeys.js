const Win32Api = require('../../../../core/desktop/win32/Win32Api');
const Win32Input = require('../../../../core/desktop/win32/Win32Input');
const Win32Windows = require('../../../../core/desktop/win32/Win32Windows');

class NativeKeys {
  static VK = { LBUTTON: 0x01, SHIFT: 0x10, CONTROL: 0x11, MENU: 0x12, LWIN: 0x5b, RWIN: 0x5c, C: 0x43, V: 0x56 };
  static MODIFIERS = [0x10, 0x11, 0x12, 0x5b, 0x5c];
  static COMBOS = { copy: [0x11, 0x43], paste: [0x11, 0x56] };

  constructor({ platform = process.platform, loadApi = () => Win32Api.load(), input = Win32Input, windows = Win32Windows } = {}) {
    this._platform = platform;
    this._loadApi = loadApi;
    this._input = input;
    this._windows = windows;
    this._extra = null;
  }

  get supported() {
    return this._platform === 'win32';
  }

  heldModifiers() {
    const { GetAsyncKeyState } = this._extraApi();
    return NativeKeys.MODIFIERS.filter((vk) => (GetAsyncKeyState(vk) & 0x8000) !== 0);
  }

  mouseDown() {
    return (this._extraApi().GetAsyncKeyState(NativeKeys.VK.LBUTTON) & 0x8000) !== 0;
  }

  windowAtCursor() {
    const api = this._loadApi();
    const buf = Buffer.alloc(8);
    if (!api.GetCursorPos(buf)) return null;
    const hit = this._windows.rootWindowAt(buf.readInt32LE(0), buf.readInt32LE(4));
    return hit ? { hwnd: Number(hit.hwnd) || 0, className: hit.className || '', pid: hit.pid || 0 } : null;
  }

  windowTitle(hwnd) {
    return this._windows.windowText(hwnd) || '';
  }

  clipboardSequence() {
    return this._extraApi().GetClipboardSequenceNumber() >>> 0;
  }

  foregroundWindow() {
    return Number(this._loadApi().GetForegroundWindow()) || 0;
  }

  focusWindow(hwnd) {
    return !!this._windows.focusWindow(hwnd);
  }

  releaseKeys(vks) {
    const K = this._input.KEYEVENTF;
    const ups = vks.map((vk) => this._input.keyInput({ vk, flags: K.KEYUP | (vk === NativeKeys.VK.LWIN || vk === NativeKeys.VK.RWIN ? K.EXTENDEDKEY : 0) }));
    if (ups.length) this._input.sendInputs(ups);
  }

  sendCombo(name) {
    const vks = NativeKeys.COMBOS[name];
    if (!vks) throw new Error(`Unknown combo ${name}`);
    const K = this._input.KEYEVENTF;
    const down = vks.map((vk) => this._input.keyInput({ vk }));
    const up = [...vks].reverse().map((vk) => this._input.keyInput({ vk, flags: K.KEYUP }));
    this._input.sendInputs([...down, ...up]);
  }

  _extraApi() {
    if (this._extra) return this._extra;
    const api = this._loadApi();
    if (api.GetAsyncKeyState && api.GetClipboardSequenceNumber) {
      this._extra = api;
      return api;
    }
    const user32 = api.koffi.load('user32.dll');
    this._extra = {
      GetAsyncKeyState: user32.func('__stdcall', 'GetAsyncKeyState', 'int16', ['int']),
      GetClipboardSequenceNumber: user32.func('__stdcall', 'GetClipboardSequenceNumber', 'uint32', []),
    };
    return this._extra;
  }
}

module.exports = NativeKeys;
