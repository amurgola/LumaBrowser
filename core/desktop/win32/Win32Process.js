const Win32Api = require('./Win32Api');
const Win32Buffers = require('./Win32Buffers');

class Win32Process {
  static PROCESS_QUERY_LIMITED_INFORMATION = 0x1000;
  static TOKEN_QUERY = 0x0008;
  static TOKEN_ELEVATION = 20;
  static MAX_PATH_CHARS = 1024;

  static imagePath(pid) {
    return Win32Process._withProcess(pid, (a, h) => {
      const buf = Buffer.alloc(Win32Process.MAX_PATH_CHARS * 2);
      const len = Buffer.alloc(4);
      len.writeUInt32LE(Win32Process.MAX_PATH_CHARS, 0);
      return a.QueryFullProcessImageNameW(h, 0, buf, len) ? Win32Buffers.readWide(buf, len.readUInt32LE(0)) : null;
    });
  }

  static isElevated(pid) {
    return Win32Process._withProcess(pid, (a, h) => {
      const tok = Buffer.alloc(8);
      if (!a.OpenProcessToken(h, Win32Process.TOKEN_QUERY, tok)) return null;
      const token = Number(tok.readBigInt64LE(0));
      try {
        return Win32Process._readElevation(a, token);
      } finally {
        a.CloseHandle(token);
      }
    });
  }

  static _readElevation(a, token) {
    const out = Buffer.alloc(4);
    const returned = Buffer.alloc(4);
    if (!a.GetTokenInformation(token, Win32Process.TOKEN_ELEVATION, out, 4, returned)) return null;
    return out.readUInt32LE(0) !== 0;
  }

  static _withProcess(pid, fn) {
    const a = Win32Api.load();
    const h = a.OpenProcess(Win32Process.PROCESS_QUERY_LIMITED_INFORMATION, false, pid);
    if (!h) return null;
    try {
      return fn(a, h);
    } finally {
      a.CloseHandle(h);
    }
  }
}

module.exports = Win32Process;
