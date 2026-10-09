const MemoryLock = require('./MemoryLock');

class WindowsMemoryLock extends MemoryLock {
  static GENERIC_READ = 0x80000000;
  static SHARE_ALL = 0x7;
  static OPEN_EXISTING = 3;
  static PAGE_READONLY = 0x02;
  static FILE_MAP_READ = 0x04;
  static QUOTA_LIMITS_HARDWS_MIN_ENABLE = 0x1;
  static CURRENT_PROCESS = -1;
  static INVALID_HANDLE = -1;
  static WORKING_SET_SLACK_BYTES = 1024 * 1024 * 1024;
  static WORKING_SET_MAX_EXTRA_BYTES = 512 * 1024 * 1024;

  constructor() {
    super();
    this._bindKernel32();
  }

  prepare(totalBytes) {
    const min = totalBytes + WindowsMemoryLock.WORKING_SET_SLACK_BYTES;
    const max = min + WindowsMemoryLock.WORKING_SET_MAX_EXTRA_BYTES;
    const ok = this._setProcessWorkingSetSizeEx(
      WindowsMemoryLock.CURRENT_PROCESS, min, max, WindowsMemoryLock.QUOTA_LIMITS_HARDWS_MIN_ENABLE
    );
    if (!ok) throw new Error(`SetProcessWorkingSetSizeEx failed (Win32 error ${this._getLastError()}).`);
  }

  mapFile(file) {
    const handle = this._openFile(file.path);
    const mapping = this._createMapping(handle, file.path);
    return this._mapView(mapping, file.path);
  }

  lockAsync(address, length) {
    return new Promise((resolve, reject) => {
      this._virtualLock.async(address, length, (err, ok) => {
        if (err) return reject(err);
        if (!ok) return reject(new Error('VirtualLock failed. This usually means the working-set quota could not cover the file.'));
        resolve();
      });
    });
  }

  _bindKernel32() {
    const koffi = require('koffi');
    const k32 = koffi.load('kernel32.dll');
    this._createFileW = k32.func('__stdcall', 'CreateFileW', 'int64', ['str16', 'uint32', 'uint32', 'int64', 'uint32', 'uint32', 'int64']);
    this._createFileMappingW = k32.func('__stdcall', 'CreateFileMappingW', 'int64', ['int64', 'int64', 'uint32', 'uint32', 'uint32', 'int64']);
    this._mapViewOfFile = k32.func('__stdcall', 'MapViewOfFile', 'int64', ['int64', 'uint32', 'uint32', 'uint32', 'size_t']);
    this._virtualLock = k32.func('__stdcall', 'VirtualLock', 'bool', ['int64', 'size_t']);
    this._setProcessWorkingSetSizeEx = k32.func('__stdcall', 'SetProcessWorkingSetSizeEx', 'bool', ['int64', 'size_t', 'size_t', 'uint32']);
    this._getLastError = k32.func('__stdcall', 'GetLastError', 'uint32', []);
  }

  _openFile(filePath) {
    const handle = Number(this._createFileW(
      filePath, WindowsMemoryLock.GENERIC_READ, WindowsMemoryLock.SHARE_ALL, 0, WindowsMemoryLock.OPEN_EXISTING, 0, 0
    ));
    if (handle === WindowsMemoryLock.INVALID_HANDLE) this._throwWin32('CreateFileW', filePath);
    return handle;
  }

  _createMapping(handle, filePath) {
    const mapping = Number(this._createFileMappingW(handle, 0, WindowsMemoryLock.PAGE_READONLY, 0, 0, 0));
    if (!mapping) this._throwWin32('CreateFileMappingW', filePath);
    return mapping;
  }

  _mapView(mapping, filePath) {
    const base = Number(this._mapViewOfFile(mapping, WindowsMemoryLock.FILE_MAP_READ, 0, 0, 0));
    if (!base) this._throwWin32('MapViewOfFile', filePath);
    return base;
  }

  _throwWin32(call, filePath) {
    throw new Error(`${call} failed for ${filePath} (Win32 error ${this._getLastError()}).`);
  }
}

module.exports = WindowsMemoryLock;
