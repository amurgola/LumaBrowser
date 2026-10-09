const MemoryLock = require('./MemoryLock');

class LinuxMemoryLock extends MemoryLock {
  static O_RDONLY = 0;
  static PROT_READ = 0x1;
  static MAP_SHARED = 0x1;
  static RLIMIT_MEMLOCK = 8;
  static RLIM_INFINITY = 0xffffffffffffffffn;
  static GIB = 1024 * 1024 * 1024;

  static toBigLimit(value) {
    if (typeof value === 'bigint') return value;
    return value >= 2 ** 62 ? LinuxMemoryLock.RLIM_INFINITY : BigInt(Math.floor(value || 0));
  }

  static limitError(limitBytes, totalBytes) {
    if (limitBytes === LinuxMemoryLock.RLIM_INFINITY || limitBytes >= BigInt(totalBytes)) return null;
    const gib = Number(limitBytes) / LinuxMemoryLock.GIB;
    return new Error(
      `The locked-memory limit (RLIMIT_MEMLOCK hard limit: ${gib.toFixed(2)} GiB) is below the model size. `
      + 'Raise it, e.g. add "* hard memlock unlimited" to /etc/security/limits.conf (or LimitMEMLOCK=infinity for systemd) and log in again.'
    );
  }

  constructor() {
    super();
    this._memlockLimit = 0n;
    this._bindLibc();
  }

  prepare(totalBytes) {
    this._raiseMemlockToHardLimit();
    const error = LinuxMemoryLock.limitError(this._memlockLimit, totalBytes);
    if (error) throw error;
  }

  mapFile(file) {
    const fd = this._open(file.path, LinuxMemoryLock.O_RDONLY);
    if (fd < 0) throw new Error(`open() failed for ${file.path} (errno ${this._koffi.errno()}).`);
    const base = Number(this._mmap(0, file.sizeBytes, LinuxMemoryLock.PROT_READ, LinuxMemoryLock.MAP_SHARED, fd, 0));
    if (base === -1) throw new Error(`mmap() failed for ${file.path} (errno ${this._koffi.errno()}).`);
    return base;
  }

  lockAsync(address, length) {
    return new Promise((resolve, reject) => {
      this._mlock.async(address, length, (err, ret) => {
        if (err) return reject(err);
        if (ret !== 0) return reject(new Error('mlock failed. This is usually the locked-memory limit (ulimit -l) or genuine RAM exhaustion.'));
        resolve();
      });
    });
  }

  _bindLibc() {
    this._koffi = require('koffi');
    const libc = this._koffi.load('libc.so.6');
    const rlimit = this._koffi.struct('luma_rlimit', { rlim_cur: 'uint64', rlim_max: 'uint64' });
    this._open = libc.func('open', 'int', ['str', 'int']);
    this._mmap = libc.func('mmap', 'int64', ['int64', 'size_t', 'int', 'int', 'int', 'int64']);
    this._mlock = libc.func('mlock', 'int', ['int64', 'size_t']);
    this._getrlimit = libc.func('getrlimit', 'int', ['int', this._koffi.out(this._koffi.pointer(rlimit))]);
    this._setrlimit = libc.func('setrlimit', 'int', ['int', this._koffi.pointer(rlimit)]);
  }

  _raiseMemlockToHardLimit() {
    const current = {};
    if (this._getrlimit(LinuxMemoryLock.RLIMIT_MEMLOCK, current) !== 0) return;
    const max = LinuxMemoryLock.toBigLimit(current.rlim_max);
    if (LinuxMemoryLock.toBigLimit(current.rlim_cur) < max) {
      this._setrlimit(LinuxMemoryLock.RLIMIT_MEMLOCK, { rlim_cur: max, rlim_max: max });
    }
    this._memlockLimit = max;
  }
}

module.exports = LinuxMemoryLock;
