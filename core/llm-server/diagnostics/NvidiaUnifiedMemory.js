class NvidiaUnifiedMemory {
  static MIB = 1024 * 1024;
  static GIB = 1024 * NvidiaUnifiedMemory.MIB;
  static SOURCE_LISTING = 'llama-list-devices';
  static SOURCE_FORMULA = 'unified-memory-formula';

  static SOC_NAME = /\bspark\b|\bgb10\b|\bn1x\b|\bjetson\b|\bthor\b|\borin\b|\bdgx\b/i;

  static MIN_SHARED_BYTES = 1 * NvidiaUnifiedMemory.GIB;

  static FORMULA_HOLDBACK_BYTES = 16 * NvidiaUnifiedMemory.GIB;
  static FORMULA_MIN_FRACTION = 0.5;
  static FORMULA_MAX_FRACTION = 0.8;
  static FORMULA_SAFETY = 0.9;

  static suspects(device) {
    if (!device) return false;
    if (device.memoryTotalMB == null) return device.computeCapability != null;
    return NvidiaUnifiedMemory.SOC_NAME.test(String(device.name || ''));
  }

  static anySuspect(cuda) {
    const devices = cuda && cuda.available && Array.isArray(cuda.devices) ? cuda.devices : [];
    return devices.some(NvidiaUnifiedMemory.suspects);
  }

  static anyUnified(diagnostics) {
    const cuda = diagnostics && diagnostics.cuda ? diagnostics.cuda : diagnostics;
    const devices = cuda && cuda.available && Array.isArray(cuda.devices) ? cuda.devices : [];
    return devices.some((d) => NvidiaUnifiedMemory.sharedBytes(d) > 0);
  }

  static isUnifiedDevice(diagnostics, index) {
    const devices = diagnostics && diagnostics.cuda && Array.isArray(diagnostics.cuda.devices) ? diagnostics.cuda.devices : [];
    return NvidiaUnifiedMemory.sharedBytes(devices[index]) > 0;
  }

  static apply(cuda, { listing = null, totalRamBytes = 0 } = {}) {
    if (!cuda || !cuda.available || !Array.isArray(cuda.devices)) return cuda;
    const listed = NvidiaUnifiedMemory._cudaDevices(listing);
    cuda.devices.forEach((device, i) => {
      if (!NvidiaUnifiedMemory.suspects(device)) return;
      const unified = NvidiaUnifiedMemory._fromListing(device, listed[i]) || NvidiaUnifiedMemory._fromFormula(device, totalRamBytes);
      if (unified) device.unifiedMemory = unified;
    });
    return cuda;
  }

  static cudaTotalBytes(device) {
    const unified = device && device.unifiedMemory;
    if (unified && Number(unified.cudaTotalMB) > 0) return Number(unified.cudaTotalMB) * NvidiaUnifiedMemory.MIB;
    return (Number(device && device.memoryTotalMB) || 0) * NvidiaUnifiedMemory.MIB;
  }

  static sharedBytes(device) {
    const unified = device && device.unifiedMemory;
    return unified ? Math.max(0, Number(unified.sharedMB) || 0) * NvidiaUnifiedMemory.MIB : 0;
  }

  static formulaSharedBytes(totalRamBytes) {
    const ram = Number(totalRamBytes) || 0;
    if (ram <= 0) return 0;
    const nominal = ram - NvidiaUnifiedMemory.FORMULA_HOLDBACK_BYTES;
    const clamped = Math.min(ram * NvidiaUnifiedMemory.FORMULA_MAX_FRACTION, Math.max(ram * NvidiaUnifiedMemory.FORMULA_MIN_FRACTION, nominal));
    return Math.floor(clamped * NvidiaUnifiedMemory.FORMULA_SAFETY);
  }

  static _cudaDevices(listing) {
    const devices = listing && Array.isArray(listing.devices) ? listing.devices : [];
    return devices.filter((d) => d && /^CUDA\d+$/i.test(String(d.id || '')));
  }

  static _fromListing(device, listed) {
    if (!listed || !(listed.totalBytes > 0)) return null;
    const MIB = NvidiaUnifiedMemory.MIB;
    const smiBytes = (Number(device.memoryTotalMB) || 0) * MIB;
    const shared = listed.totalBytes - smiBytes;
    if (smiBytes > 0 && shared < NvidiaUnifiedMemory.MIN_SHARED_BYTES) return null;
    return {
      cudaTotalMB: Math.round(listed.totalBytes / MIB),
      cudaFreeMB: listed.freeBytes > 0 ? Math.round(listed.freeBytes / MIB) : null,
      sharedMB: Math.round(Math.max(0, shared) / MIB),
      source: NvidiaUnifiedMemory.SOURCE_LISTING,
    };
  }

  static _fromFormula(device, totalRamBytes) {
    const MIB = NvidiaUnifiedMemory.MIB;
    const smiMB = Number(device.memoryTotalMB) || 0;
    const shared = NvidiaUnifiedMemory.formulaSharedBytes(totalRamBytes);
    if (smiMB <= 0 || shared <= 0) return null;
    return { cudaTotalMB: smiMB + Math.round(shared / MIB), cudaFreeMB: null, sharedMB: Math.round(shared / MIB), source: NvidiaUnifiedMemory.SOURCE_FORMULA };
  }
}

module.exports = NvidiaUnifiedMemory;
