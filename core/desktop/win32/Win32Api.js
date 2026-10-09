class Win32Api {
  static _api = null;
  static _desktopApi = null;

  static load() {
    if (Win32Api._api) return Win32Api._api;
    if (process.platform !== 'win32') throw new Error('win32 bindings are Windows-only');
    Win32Api._api = Win32Api._bind(require('koffi'));
    return Win32Api._api;
  }

  static loadDesktop() {
    if (Win32Api._desktopApi) return Win32Api._desktopApi;
    const user32 = Win32Api.load().koffi.load('user32.dll');
    const f = (name, ret, args) => user32.func('__stdcall', name, ret, args);
    Win32Api._desktopApi = {
      OpenInputDesktop: f('OpenInputDesktop', 'intptr_t', ['uint32', 'bool', 'uint32']),
      CloseDesktop: f('CloseDesktop', 'bool', ['intptr_t']),
      GetUserObjectInformationW: f('GetUserObjectInformationW', 'bool', ['intptr_t', 'int', 'void *', 'uint32', 'void *']),
    };
    return Win32Api._desktopApi;
  }

  static _bind(koffi) {
    const libs = {
      user32: koffi.load('user32.dll'),
      gdi32: koffi.load('gdi32.dll'),
      kernel32: koffi.load('kernel32.dll'),
      dwmapi: koffi.load('dwmapi.dll'),
      advapi32: koffi.load('advapi32.dll'),
    };
    const WNDENUMPROC = koffi.proto('bool __stdcall WNDENUMPROC(intptr_t hwnd, intptr_t lParam)');
    const f = (lib, name, ret, args) => libs[lib].func('__stdcall', name, ret, args);
    return {
      koffi,
      WNDENUMPROC,
      ...Win32Api._windowFunctions(f, koffi, WNDENUMPROC),
      ...Win32Api._inputFunctions(f),
      ...Win32Api._captureFunctions(f),
      ...Win32Api._processFunctions(f),
    };
  }

  static _windowFunctions(f, koffi, WNDENUMPROC) {
    return {
      EnumWindows: f('user32', 'EnumWindows', 'bool', [koffi.pointer(WNDENUMPROC), 'intptr_t']),
      IsWindow: f('user32', 'IsWindow', 'bool', ['intptr_t']),
      IsWindowVisible: f('user32', 'IsWindowVisible', 'bool', ['intptr_t']),
      IsIconic: f('user32', 'IsIconic', 'bool', ['intptr_t']),
      GetWindowTextW: f('user32', 'GetWindowTextW', 'int', ['intptr_t', 'void *', 'int']),
      GetClassNameW: f('user32', 'GetClassNameW', 'int', ['intptr_t', 'void *', 'int']),
      GetWindowThreadProcessId: f('user32', 'GetWindowThreadProcessId', 'uint32', ['intptr_t', 'void *']),
      GetWindowRect: f('user32', 'GetWindowRect', 'bool', ['intptr_t', 'void *']),
      GetWindowLongPtrW: f('user32', 'GetWindowLongPtrW', 'intptr_t', ['intptr_t', 'int']),
      GetAncestor: f('user32', 'GetAncestor', 'intptr_t', ['intptr_t', 'uint32']),
      GetForegroundWindow: f('user32', 'GetForegroundWindow', 'intptr_t', []),
      SetForegroundWindow: f('user32', 'SetForegroundWindow', 'bool', ['intptr_t']),
      BringWindowToTop: f('user32', 'BringWindowToTop', 'bool', ['intptr_t']),
      ShowWindow: f('user32', 'ShowWindow', 'bool', ['intptr_t', 'int']),
      AttachThreadInput: f('user32', 'AttachThreadInput', 'bool', ['uint32', 'uint32', 'bool']),
      WindowFromPoint: f('user32', 'WindowFromPoint', 'intptr_t', ['int64']),
      GetSystemMetrics: f('user32', 'GetSystemMetrics', 'int', ['int']),
      DwmGetWindowAttribute: f('dwmapi', 'DwmGetWindowAttribute', 'int32', ['intptr_t', 'uint32', 'void *', 'uint32']),
    };
  }

  static _inputFunctions(f) {
    return {
      SendInput: f('user32', 'SendInput', 'uint32', ['uint32', 'void *', 'int']),
      SetCursorPos: f('user32', 'SetCursorPos', 'bool', ['int', 'int']),
      GetCursorPos: f('user32', 'GetCursorPos', 'bool', ['void *']),
      VkKeyScanW: f('user32', 'VkKeyScanW', 'int16', ['uint16']),
      MapVirtualKeyW: f('user32', 'MapVirtualKeyW', 'uint32', ['uint32', 'uint32']),
    };
  }

  static _captureFunctions(f) {
    return {
      GetDC: f('user32', 'GetDC', 'intptr_t', ['intptr_t']),
      ReleaseDC: f('user32', 'ReleaseDC', 'int', ['intptr_t', 'intptr_t']),
      PrintWindow: f('user32', 'PrintWindow', 'bool', ['intptr_t', 'intptr_t', 'uint32']),
      CreateCompatibleDC: f('gdi32', 'CreateCompatibleDC', 'intptr_t', ['intptr_t']),
      CreateCompatibleBitmap: f('gdi32', 'CreateCompatibleBitmap', 'intptr_t', ['intptr_t', 'int', 'int']),
      SelectObject: f('gdi32', 'SelectObject', 'intptr_t', ['intptr_t', 'intptr_t']),
      BitBlt: f('gdi32', 'BitBlt', 'bool', ['intptr_t', 'int', 'int', 'int', 'int', 'intptr_t', 'int', 'int', 'uint32']),
      GetDIBits: f('gdi32', 'GetDIBits', 'int', ['intptr_t', 'intptr_t', 'uint32', 'uint32', 'void *', 'void *', 'uint32']),
      DeleteObject: f('gdi32', 'DeleteObject', 'bool', ['intptr_t']),
      DeleteDC: f('gdi32', 'DeleteDC', 'bool', ['intptr_t']),
    };
  }

  static _processFunctions(f) {
    return {
      GetCurrentThreadId: f('kernel32', 'GetCurrentThreadId', 'uint32', []),
      GetCurrentProcessId: f('kernel32', 'GetCurrentProcessId', 'uint32', []),
      OpenProcess: f('kernel32', 'OpenProcess', 'intptr_t', ['uint32', 'bool', 'uint32']),
      CloseHandle: f('kernel32', 'CloseHandle', 'bool', ['intptr_t']),
      QueryFullProcessImageNameW: f('kernel32', 'QueryFullProcessImageNameW', 'bool', ['intptr_t', 'uint32', 'void *', 'void *']),
      OpenProcessToken: f('advapi32', 'OpenProcessToken', 'bool', ['intptr_t', 'uint32', 'void *']),
      GetTokenInformation: f('advapi32', 'GetTokenInformation', 'bool', ['intptr_t', 'uint32', 'void *', 'uint32', 'void *']),
    };
  }
}

module.exports = Win32Api;
