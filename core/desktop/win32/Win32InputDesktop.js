const Win32Api = require('./Win32Api');
const Win32Buffers = require('./Win32Buffers');

class Win32InputDesktop {
  static DESKTOP_READOBJECTS = 0x0001;
  static UOI_NAME = 2;

  static name() {
    const d = Win32Api.loadDesktop();
    const h = d.OpenInputDesktop(0, false, Win32InputDesktop.DESKTOP_READOBJECTS);
    if (!h) return null;
    try {
      const buf = Buffer.alloc(512);
      const need = Buffer.alloc(4);
      if (!d.GetUserObjectInformationW(h, Win32InputDesktop.UOI_NAME, buf, buf.length, need)) return null;
      return Win32Buffers.readWideZ(buf);
    } finally {
      d.CloseDesktop(h);
    }
  }
}

module.exports = Win32InputDesktop;
