const Win32Api = require('./Win32Api');

class Win32Shell {
  static SW_SHOWNORMAL = 1;
  static FAILURES = {
    0: 'Windows is out of memory or resources',
    2: 'not found',
    3: 'path not found',
    5: 'access denied',
    8: 'Windows is out of memory',
    26: 'a sharing violation',
    27: 'the file association is incomplete',
    31: 'no app is associated with it',
    32: 'a required DLL was not found',
  };

  static open(file, params = null) {
    const code = Number(Win32Api.loadShell().ShellExecuteW(0, 'open', String(file), params ? String(params) : null, null, Win32Shell.SW_SHOWNORMAL));
    if (code > 32) return;
    const why = Win32Shell.FAILURES[code] || `error ${code}`;
    throw new Error(`Windows could not open "${file}": ${why}.`);
  }
}

module.exports = Win32Shell;
