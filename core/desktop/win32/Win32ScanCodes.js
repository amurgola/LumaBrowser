const Win32Api = require('./Win32Api');
const DesktopKeys = require('../DesktopKeys');

class Win32ScanCodes {
  static MAPVK_VK_TO_VSC_EX = 4;
  static US_SCAN = Win32ScanCodes._buildUsTable();

  static scanCodeFor(vk) {
    const code = Win32ScanCodes._layoutCode(vk) || Win32ScanCodes.US_SCAN[vk] || 0;
    if (!code) return null;
    return { scan: code & 0xff, extended: Win32ScanCodes._isExtended(vk, code) };
  }

  static _layoutCode(vk) {
    try {
      return Win32Api.load().MapVirtualKeyW(vk, Win32ScanCodes.MAPVK_VK_TO_VSC_EX) >>> 0;
    } catch (_) {
      return 0;
    }
  }

  static _isExtended(vk, code) {
    const prefix = (code >> 8) & 0xff;
    return prefix === 0xe0 || prefix === 0xe1 || DesktopKeys.EXTENDED.has(vk);
  }

  static _buildUsTable() {
    const table = {
      0x08: 0x0e, 0x09: 0x0f, 0x0d: 0x1c, 0x10: 0x2a, 0x11: 0x1d, 0x12: 0x38, 0x14: 0x3a, 0x1b: 0x01, 0x20: 0x39,
      0x21: 0xe049, 0x22: 0xe051, 0x23: 0xe04f, 0x24: 0xe047,
      0x25: 0xe04b, 0x26: 0xe048, 0x27: 0xe04d, 0x28: 0xe050, 0x2d: 0xe052, 0x2e: 0xe053,
      0x5b: 0xe05b, 0x5d: 0xe05d, 0x90: 0x45, 0x91: 0x46,
      0xba: 0x27, 0xbb: 0x0d, 0xbc: 0x33, 0xbd: 0x0c, 0xbe: 0x34, 0xbf: 0x35, 0xc0: 0x29, 0xdb: 0x1a, 0xdc: 0x2b, 0xdd: 0x1b, 0xde: 0x28,
      0x30: 0x0b,
    };
    for (let d = 1; d <= 9; d++) table[0x30 + d] = 0x01 + d;
    Win32ScanCodes._addRow(table, 'QWERTYUIOP', 0x10);
    Win32ScanCodes._addRow(table, 'ASDFGHJKL', 0x1e);
    Win32ScanCodes._addRow(table, 'ZXCVBNM', 0x2c);
    for (let i = 1; i <= 10; i++) table[0x6f + i] = 0x3a + i;
    table[0x7a] = 0x57;
    table[0x7b] = 0x58;
    return table;
  }

  static _addRow(table, letters, firstScan) {
    letters.split('').forEach((c, i) => { table[c.charCodeAt(0)] = firstScan + i; });
  }
}

module.exports = Win32ScanCodes;
