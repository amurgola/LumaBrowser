const ShellWords = require('../ShellWords');
const HostPathSpelling = require('./HostPathSpelling');

class RawDevicePath {
  static PSEUDO_DEVICES = new Set(['null', 'zero', 'full', 'random', 'urandom', 'stdin', 'stdout', 'stderr', 'console', 'ptmx', 'kmsg']);
  static PSEUDO_FAMILIES = /^(tty|pts\/|fd\/|shm\/|mqueue\/|cu\.)/;

  static is(pathText) {
    const text = HostPathSpelling.unquote(String(pathText ?? '').trim());
    if (/^[\\/]{2}\.[\\/]./.test(text)) return true;
    const device = /^\/dev\/(.+)$/.exec(text.replace(/\/{2,}/g, '/'));
    return Boolean(device) && !RawDevicePath._isPseudo(ShellWords.lower(device[1]));
  }

  static _isPseudo(name) {
    return RawDevicePath.PSEUDO_DEVICES.has(name) || RawDevicePath.PSEUDO_FAMILIES.test(name);
  }
}

module.exports = RawDevicePath;
