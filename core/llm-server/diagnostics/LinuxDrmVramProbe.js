const fs = require('fs');
const path = require('path');

class LinuxDrmVramProbe {
  static DRM_ROOT = '/sys/class/drm';
  static INTEL = 0x8086;
  static AMD = 0x1002;
  static INTEL_IGPU_ADDRESS = '0000:00:02.0';
  static APU_MAX_VRAM_BYTES = 2 * 1024 * 1024 * 1024;

  static probe({ platform = process.platform, fsLike = fs } = {}) {
    if (platform !== 'linux') return null;
    let names;
    try {
      names = fsLike.readdirSync(LinuxDrmVramProbe.DRM_ROOT).filter((n) => /^card\d+$/.test(n));
    } catch (_) {
      return null;
    }
    const rows = [];
    const seen = new Set();
    for (const name of names) {
      const row = LinuxDrmVramProbe._readCard(fsLike, `${LinuxDrmVramProbe.DRM_ROOT}/${name}/device`);
      const key = row && `${row.vendorId}:${row.deviceId}:${row.pciAddress}`;
      if (!row || seen.has(key)) continue;
      seen.add(key);
      rows.push(row);
    }
    return rows;
  }

  static isIntegrated(vendorId, pciAddress, vramTotalBytes) {
    if (vendorId === LinuxDrmVramProbe.INTEL) return pciAddress === LinuxDrmVramProbe.INTEL_IGPU_ADDRESS;
    if (vendorId === LinuxDrmVramProbe.AMD) return vramTotalBytes != null && vramTotalBytes < LinuxDrmVramProbe.APU_MAX_VRAM_BYTES;
    return false;
  }

  static _readCard(fsLike, deviceDir) {
    const vendorId = LinuxDrmVramProbe._hex(fsLike, `${deviceDir}/vendor`);
    const deviceId = LinuxDrmVramProbe._hex(fsLike, `${deviceDir}/device`);
    if (vendorId == null || deviceId == null) return null;
    const pciAddress = LinuxDrmVramProbe._pciAddress(fsLike, deviceDir);
    const vramTotalBytes = LinuxDrmVramProbe._number(fsLike, `${deviceDir}/mem_info_vram_total`);
    const vramUsedBytes = LinuxDrmVramProbe._number(fsLike, `${deviceDir}/mem_info_vram_used`);
    return {
      vendorId, deviceId, pciAddress, vramTotalBytes, vramUsedBytes,
      integrated: LinuxDrmVramProbe.isIntegrated(vendorId, pciAddress, vramTotalBytes),
    };
  }

  static _read(fsLike, file) {
    try { return String(fsLike.readFileSync(file, 'utf8')).trim(); } catch (_) { return null; }
  }

  static _hex(fsLike, file) {
    const text = LinuxDrmVramProbe._read(fsLike, file);
    const value = text ? parseInt(text, 16) : NaN;
    return Number.isFinite(value) ? value : null;
  }

  static _number(fsLike, file) {
    const text = LinuxDrmVramProbe._read(fsLike, file);
    const value = text ? Number(text) : NaN;
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  static _pciAddress(fsLike, deviceDir) {
    try { return path.posix.basename(fsLike.realpathSync(deviceDir)); } catch (_) { return null; }
  }
}

module.exports = LinuxDrmVramProbe;
