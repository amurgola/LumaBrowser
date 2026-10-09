class ResourceBudget {
  static MIB = 1024 * 1024;
  static GIB = 1024 * ResourceBudget.MIB;
  static RAM_RESERVE_FRACTION = 0.25;
  static RAM_RESERVE_MIN = 2 * ResourceBudget.GIB;
  static RAM_RESERVE_MAX = 8 * ResourceBudget.GIB;
  static RAM_SAFETY_BYTES = ResourceBudget.GIB;
  static VRAM_RESERVE_PER_ADAPTER = ResourceBudget.GIB;
  static VRAM_SAFETY_BYTES = 512 * ResourceBudget.MIB;

  static compute(memory, gpu, cuda) {
    return { ram: ResourceBudget._ram(memory), vram: ResourceBudget._vram(gpu, cuda) };
  }

  static _ram(memory) {
    const total = Number(memory && memory.totalBytes) || 0;
    const free = Number(memory && memory.freeBytes) || 0;
    const reserve = Math.max(ResourceBudget.RAM_RESERVE_MIN,
      Math.min(ResourceBudget.RAM_RESERVE_MAX, Math.round(total * ResourceBudget.RAM_RESERVE_FRACTION)));
    const max = Math.max(0, total - reserve);
    return {
      totalBytes: total,
      reserveBytes: reserve,
      maxBytes: max,
      currentlyFreeBytes: Math.min(max, Math.max(0, free - ResourceBudget.RAM_SAFETY_BYTES)),
      note: 'Reserves 25% of total (clamped to 2–8 GB) for the OS and the rest of LumaBrowser.',
    };
  }

  static _vram(gpu, cuda) {
    const nvidiaDevices = (cuda && cuda.available && Array.isArray(cuda.devices)) ? cuda.devices : [];
    const perAdapter = [
      ...ResourceBudget._nvidiaRows(nvidiaDevices),
      ...ResourceBudget._otherAdapterRows(gpu, ResourceBudget._nvidiaPciKeys(nvidiaDevices)),
    ];
    const sum = (key) => perAdapter.reduce((total, row) => total + (row[key] || 0), 0);
    const hasFreeData = perAdapter.some((row) => row.currentlyFreeBytes != null);
    return {
      totalBytes: sum('totalBytes'),
      reserveBytes: sum('reserveBytes'),
      maxBytes: sum('maxBytes'),
      currentlyFreeBytes: hasFreeData ? sum('currentlyFreeBytes') : null,
      perAdapter,
      note: 'Reserves 1 GB per adapter for the desktop compositor, GPU driver, and KV-cache headroom.',
      hasFreeData,
    };
  }

  static _nvidiaRows(devices) {
    const rows = [];
    for (const device of devices) {
      const totalBytes = (Number(device.memoryTotalMB) || 0) * ResourceBudget.MIB;
      if (totalBytes <= 0) continue;
      const freeBytes = device.memoryFreeMB != null ? Number(device.memoryFreeMB) * ResourceBudget.MIB : null;
      rows.push(ResourceBudget._row(device.name || 'NVIDIA GPU', 'NVIDIA', 'nvidia-smi', totalBytes, freeBytes));
    }
    return rows;
  }

  static _otherAdapterRows(gpu, nvidiaPciKeys) {
    const adapters = (gpu && Array.isArray(gpu.adapters)) ? gpu.adapters : [];
    return adapters
      .filter((a) => a.vramTotalBytes != null && a.vramTotalBytes > 0 && a.vendor !== 'NVIDIA')
      .filter((a) => !(a.vendorId != null && a.deviceId != null && nvidiaPciKeys.has(`${a.vendorId}:${a.deviceId}`)))
      .map((a) => ResourceBudget._row(
        a.displayName || a.deviceString || `${a.vendor || 'GPU'} adapter`,
        a.vendor || null, a.vramSource || null, a.vramTotalBytes, a.vramFreeBytes,
      ));
  }

  static _nvidiaPciKeys(devices) {
    return new Set(devices.filter((d) => d.pciDeviceId).map((d) => `${d.pciDeviceId.vendorId}:${d.pciDeviceId.deviceId}`));
  }

  static _row(name, vendor, source, totalBytes, freeBytes) {
    const reserve = ResourceBudget.VRAM_RESERVE_PER_ADAPTER;
    return {
      name,
      vendor,
      source,
      totalBytes,
      reserveBytes: reserve,
      maxBytes: Math.max(0, totalBytes - reserve),
      currentlyFreeBytes: freeBytes != null ? Math.max(0, freeBytes - ResourceBudget.VRAM_SAFETY_BYTES) : null,
    };
  }
}

module.exports = ResourceBudget;
