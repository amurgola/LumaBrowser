const Win32Api = require('./win32/Win32Api');
const Win32Windows = require('./win32/Win32Windows');
const Win32Process = require('./win32/Win32Process');
const Win32Capture = require('./win32/Win32Capture');
const Win32Input = require('./win32/Win32Input');
const Win32ScanCodes = require('./win32/Win32ScanCodes');
const Win32InputDesktop = require('./win32/Win32InputDesktop');

class Win32 {
  static MOUSEEVENTF = Win32Input.MOUSEEVENTF;
  static KEYEVENTF = Win32Input.KEYEVENTF;
  static INPUT_SIZE = Win32Input.INPUT_SIZE;
  static KEYEVENTF_SCANCODE = Win32Input.KEYEVENTF_SCANCODE;
  static MOUSEEVENTF_MOVE = Win32Input.MOUSEEVENTF_MOVE;

  static load() { return Win32Api.load(); }

  static listTopLevelWindows() { return Win32Windows.listTopLevelWindows(); }
  static windowText(hwnd) { return Win32Windows.windowText(hwnd); }
  static className(hwnd) { return Win32Windows.className(hwnd); }
  static processIdOf(hwnd) { return Win32Windows.processIdOf(hwnd); }
  static windowRect(hwnd) { return Win32Windows.windowRect(hwnd); }
  static focusWindow(hwnd) { return Win32Windows.focusWindow(hwnd); }
  static virtualScreen() { return Win32Windows.virtualScreen(); }

  static processImagePath(pid) { return Win32Process.imagePath(pid); }
  static isElevated(pid) { return Win32Process.isElevated(pid); }

  static captureBGRA(opts) { return Win32Capture.captureBGRA(opts); }
  static isBlank(bgra) { return Win32Capture.isBlank(bgra); }

  static mouseInput(flags, mouseData) { return Win32Input.mouseInput(flags, mouseData); }
  static keyInput(k) { return Win32Input.keyInput(k); }
  static keyInputScan(k) { return Win32Input.keyInputScan(k); }
  static relativeMoveInput(dx, dy) { return Win32Input.relativeMoveInput(dx, dy); }
  static sendInputs(inputs) { return Win32Input.sendInputs(inputs); }
  static scanCodeFor(vk) { return Win32ScanCodes.scanCodeFor(vk); }

  static inputDesktopName() { return Win32InputDesktop.name(); }
}

module.exports = Win32;
