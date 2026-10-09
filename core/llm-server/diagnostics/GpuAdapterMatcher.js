class GpuAdapterMatcher {
  static KNOWN_VENDORS = {
    0x10de: 'NVIDIA',
    0x1002: 'AMD',
    0x8086: 'Intel',
    0x106b: 'Apple',
    0x1414: 'Microsoft',
  };

  static vendorName(vendorId) {
    if (vendorId == null) return null;
    return GpuAdapterMatcher.KNOWN_VENDORS[vendorId] || `0x${vendorId.toString(16)}`;
  }

  static pciKey(vendorId, deviceId) {
    return `${vendorId}:${deviceId}`;
  }

  static indexNvidiaByName(cuda) {
    if (!GpuAdapterMatcher._hasDevices(cuda)) return null;
    const index = new Map();
    for (const device of cuda.devices) if (device.name) index.set(device.name.toLowerCase(), device);
    return index;
  }

  static indexNvidiaByPci(cuda) {
    if (!GpuAdapterMatcher._hasDevices(cuda)) return null;
    const index = new Map();
    for (const device of cuda.devices) {
      const id = device.pciDeviceId;
      if (id && id.vendorId != null && id.deviceId != null) index.set(GpuAdapterMatcher.pciKey(id.vendorId, id.deviceId), device);
    }
    return index;
  }

  static matchNvidiaByPci(adapter, pciIndex) {
    if (!pciIndex || adapter.vendorId == null || adapter.deviceId == null) return null;
    return pciIndex.get(GpuAdapterMatcher.pciKey(adapter.vendorId, adapter.deviceId)) || null;
  }

  static matchNvidiaByName(adapterName, nameIndex) {
    if (!nameIndex || !adapterName) return null;
    const lower = adapterName.toLowerCase();
    if (nameIndex.has(lower)) return nameIndex.get(lower);
    for (const [name, device] of nameIndex) {
      if (lower.includes(name) || name.includes(lower)) return device;
    }
    return null;
  }

  static matchRegistry(adapterName, registryRows) {
    if (!registryRows || !adapterName) return null;
    const lower = adapterName.toLowerCase();
    for (const row of registryRows) {
      const desc = (row.DriverDesc || '').toLowerCase();
      if (desc && (desc === lower || lower.includes(desc) || desc.includes(lower))) return row;
    }
    return null;
  }

  static dedupe(adapters) {
    const out = [];
    const indexByKey = new Map();
    for (const adapter of adapters) {
      if (adapter.vendorId == null || adapter.deviceId == null) {
        out.push(adapter);
        continue;
      }
      const key = GpuAdapterMatcher.pciKey(adapter.vendorId, adapter.deviceId);
      const existing = indexByKey.get(key);
      if (existing === undefined) {
        indexByKey.set(key, out.length);
        out.push(adapter);
      } else if (adapter.active && !out[existing].active) {
        out[existing] = adapter;
      }
    }
    return out;
  }

  static _hasDevices(cuda) {
    return !!cuda && cuda.available && Array.isArray(cuda.devices);
  }
}

module.exports = GpuAdapterMatcher;
