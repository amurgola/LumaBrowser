const Win32Api = require('./Win32Api');

class Win32Capture {
  static PW_RENDERFULLCONTENT = 0x2;
  static SRCCOPY = 0x00CC0020;
  static CAPTUREBLT = 0x40000000;
  static BITMAPINFO_SIZE = 44;
  static BLANK_SAMPLE_STRIDE = 4 * 97;

  static captureBGRA({ hwnd = 0, rect }) {
    const { width, height } = rect;
    if (!(width > 0 && height > 0)) throw new Error('capture: empty rectangle');
    const a = Win32Api.load();
    const screenDC = a.GetDC(0);
    const memDC = a.CreateCompatibleDC(screenDC);
    const bmp = a.CreateCompatibleBitmap(screenDC, width, height);
    const old = a.SelectObject(memDC, bmp);
    try {
      Win32Capture._draw(a, { hwnd, rect, memDC, screenDC });
      a.SelectObject(memDC, old);
      return { width, height, bgra: Win32Capture._readBits(a, memDC, bmp, width, height) };
    } finally {
      a.DeleteObject(bmp);
      a.DeleteDC(memDC);
      a.ReleaseDC(0, screenDC);
    }
  }

  static isBlank(bgra) {
    for (let i = 0; i < bgra.length; i += Win32Capture.BLANK_SAMPLE_STRIDE) {
      if (bgra[i] || bgra[i + 1] || bgra[i + 2]) return false;
    }
    return true;
  }

  static _draw(a, { hwnd, rect, memDC, screenDC }) {
    const ok = hwnd
      ? a.PrintWindow(hwnd, memDC, Win32Capture.PW_RENDERFULLCONTENT)
      : a.BitBlt(memDC, 0, 0, rect.width, rect.height, screenDC, rect.x, rect.y, Win32Capture.SRCCOPY | Win32Capture.CAPTUREBLT);
    if (!ok) throw new Error(hwnd ? 'PrintWindow failed' : 'BitBlt failed');
  }

  static _readBits(a, memDC, bmp, width, height) {
    const bgra = Buffer.alloc(width * height * 4);
    const lines = a.GetDIBits(memDC, bmp, 0, height, bgra, Win32Capture.bitmapInfo(width, height), 0);
    if (lines !== height) throw new Error('GetDIBits failed');
    return bgra;
  }

  static bitmapInfo(width, height) {
    const bmi = Buffer.alloc(Win32Capture.BITMAPINFO_SIZE);
    bmi.writeUInt32LE(40, 0);
    bmi.writeInt32LE(width, 4);
    bmi.writeInt32LE(-height, 8);
    bmi.writeUInt16LE(1, 12);
    bmi.writeUInt16LE(32, 14);
    bmi.writeUInt32LE(0, 16);
    return bmi;
  }
}

module.exports = Win32Capture;
