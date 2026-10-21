const path = require('path');
const DownloadError = require('./DownloadError');
const VolumeFreeSpace = require('./VolumeFreeSpace');

class FreeSpaceGuard {
  static FLOOR_BYTES = 512 * 1024 * 1024;

  static async assert(destDir, needBytes, { freeSpace = FreeSpaceGuard.defaultReader(), forLabel = '' } = {}) {
    const need = Math.max(0, Number(needBytes) || 0);
    if (need === 0) return { freeBytes: null, needBytes: 0, checked: false };
    const { freeBytes } = await freeSpace(destDir);
    if (!Number.isFinite(freeBytes)) return { freeBytes: null, needBytes: need, checked: false };
    const required = need + FreeSpaceGuard.FLOOR_BYTES;
    if (freeBytes < required) {
      throw DownloadError.noSpace(
        `Not enough free space${forLabel} in ${path.resolve(destDir)}: the download needs about ${FreeSpaceGuard.format(need)}`
        + ` (plus ${FreeSpaceGuard.format(FreeSpaceGuard.FLOOR_BYTES)} headroom) but only ${FreeSpaceGuard.format(freeBytes)} is free.`);
    }
    return { freeBytes, needBytes: need, checked: true };
  }

  static defaultReader() {
    return (dir) => VolumeFreeSpace.read(dir);
  }

  static format(bytes) {
    const n = Number(bytes) || 0;
    if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(n >= 10 * 1024 ** 3 ? 0 : 1)} GB`;
    if (n >= 1024 ** 2) return `${Math.round(n / 1024 ** 2)} MB`;
    return `${Math.round(n / 1024)} KB`;
  }
}

module.exports = FreeSpaceGuard;
