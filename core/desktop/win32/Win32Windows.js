const Win32Api = require('./Win32Api');
const Win32Buffers = require('./Win32Buffers');
const Win32Input = require('./Win32Input');

class Win32Windows {
  static GWL_EXSTYLE = -20;
  static WS_EX_TOOLWINDOW = 0x80;
  static GA_ROOTOWNER = 3;
  static DWMWA_EXTENDED_FRAME_BOUNDS = 9;
  static DWMWA_CLOAKED = 14;
  static SW_RESTORE = 9;
  static SM_XVIRTUALSCREEN = 76;
  static SM_YVIRTUALSCREEN = 77;
  static SM_CXVIRTUALSCREEN = 78;
  static SM_CYVIRTUALSCREEN = 79;
  static MIN_WIDTH = 40;
  static MIN_HEIGHT = 30;
  static FOCUS_ATTEMPTS = 3;

  static listTopLevelWindows() {
    return Win32Windows._enumerate().map(Win32Windows._describeIfListed).filter(Boolean);
  }

  static windowText(hwnd) {
    const buf = Buffer.alloc(1024);
    return Win32Buffers.readWide(buf, Win32Api.load().GetWindowTextW(hwnd, buf, 512));
  }

  static className(hwnd) {
    const buf = Buffer.alloc(512);
    return Win32Buffers.readWide(buf, Win32Api.load().GetClassNameW(hwnd, buf, 256));
  }

  static processIdOf(hwnd) {
    const buf = Buffer.alloc(4);
    const tid = Win32Api.load().GetWindowThreadProcessId(hwnd, buf);
    return { pid: buf.readUInt32LE(0), tid };
  }

  static windowRect(hwnd) {
    const a = Win32Api.load();
    const buf = Buffer.alloc(16);
    if (a.DwmGetWindowAttribute(hwnd, Win32Windows.DWMWA_EXTENDED_FRAME_BOUNDS, buf, 16) === 0) return Win32Buffers.rectFrom(buf);
    if (a.GetWindowRect(hwnd, buf)) return Win32Buffers.rectFrom(buf);
    return null;
  }

  static isCloaked(hwnd) {
    const buf = Buffer.alloc(4);
    return Win32Api.load().DwmGetWindowAttribute(hwnd, Win32Windows.DWMWA_CLOAKED, buf, 4) === 0 && buf.readUInt32LE(0) !== 0;
  }

  static focusWindow(hwnd) {
    const a = Win32Api.load();
    if (a.IsIconic(hwnd)) a.ShowWindow(hwnd, Win32Windows.SW_RESTORE);
    if (a.GetForegroundWindow() === hwnd) return true;
    for (let attempt = 0; attempt < Win32Windows.FOCUS_ATTEMPTS; attempt++) {
      Win32Windows._raiseAttachedToForeground(a, hwnd);
      if (a.GetForegroundWindow() === hwnd) return true;
      Win32Input.sendInputs(Win32Input.altTap());
    }
    return a.GetForegroundWindow() === hwnd;
  }

  static virtualScreen() {
    const a = Win32Api.load();
    return {
      x: a.GetSystemMetrics(Win32Windows.SM_XVIRTUALSCREEN),
      y: a.GetSystemMetrics(Win32Windows.SM_YVIRTUALSCREEN),
      width: a.GetSystemMetrics(Win32Windows.SM_CXVIRTUALSCREEN),
      height: a.GetSystemMetrics(Win32Windows.SM_CYVIRTUALSCREEN),
    };
  }

  static _enumerate() {
    const hwnds = [];
    Win32Api.load().EnumWindows((hwnd) => { hwnds.push(hwnd); return true; }, 0);
    return hwnds;
  }

  static _describeIfListed(hwnd) {
    const a = Win32Api.load();
    if (!a.IsWindowVisible(hwnd) || Win32Windows.isCloaked(hwnd)) return null;
    if (Number(a.GetWindowLongPtrW(hwnd, Win32Windows.GWL_EXSTYLE)) & Win32Windows.WS_EX_TOOLWINDOW) return null;
    if (a.GetAncestor(hwnd, Win32Windows.GA_ROOTOWNER) !== hwnd) return null;
    const title = Win32Windows.windowText(hwnd);
    if (!title) return null;
    const rect = Win32Windows.windowRect(hwnd);
    if (!rect || rect.width < Win32Windows.MIN_WIDTH || rect.height < Win32Windows.MIN_HEIGHT) return null;
    const { pid } = Win32Windows.processIdOf(hwnd);
    return { hwnd, title, className: Win32Windows.className(hwnd), pid, rect, minimized: !!a.IsIconic(hwnd) };
  }

  static _raiseAttachedToForeground(a, hwnd) {
    const fg = a.GetForegroundWindow();
    const me = a.GetCurrentThreadId();
    const fgTid = fg ? Win32Windows.processIdOf(fg).tid : 0;
    const attached = fgTid && fgTid !== me ? a.AttachThreadInput(me, fgTid, true) : false;
    try {
      a.BringWindowToTop(hwnd);
      a.SetForegroundWindow(hwnd);
    } finally {
      if (attached) a.AttachThreadInput(me, fgTid, false);
    }
  }
}

module.exports = Win32Windows;
