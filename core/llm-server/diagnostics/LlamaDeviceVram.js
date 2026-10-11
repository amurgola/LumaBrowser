class LlamaDeviceVram {
  static SOURCE = 'llama-list-devices';
  static VENDOR_PATTERNS = [
    ['NVIDIA', /nvidia|geforce|quadro|tesla|\brtx\b/i],
    ['AMD', /\bamd\b|radeon|\bati\b/i],
    ['Intel', /intel|\barc\b/i],
  ];
  static FILLABLE_VENDORS = new Set(['Intel', 'AMD']);

  static apply(gpu, listing) {
    if (!gpu || !Array.isArray(gpu.adapters) || !listing || !Array.isArray(listing.devices)) return gpu;
    const adapters = gpu.adapters.filter((a) => a && LlamaDeviceVram.FILLABLE_VENDORS.has(a.vendor) && !(a.vramTotalBytes > 0));
    const devices = listing.devices.filter((d) => LlamaDeviceVram.FILLABLE_VENDORS.has(LlamaDeviceVram.vendorOf(d.name)));
    for (const [adapter, device] of LlamaDeviceVram.pair(adapters, devices)) LlamaDeviceVram._fill(adapter, device);
    return gpu;
  }

  static vendorOf(name) {
    const hit = LlamaDeviceVram.VENDOR_PATTERNS.find(([, pattern]) => pattern.test(String(name || '')));
    return hit ? hit[0] : null;
  }

  static pair(adapters, devices) {
    const pairs = [];
    const freeAdapters = new Set(adapters);
    const freeDevices = new Set(devices);
    for (const device of devices) {
      const tokens = LlamaDeviceVram._modelTokens(device.name);
      if (tokens.length === 0) continue;
      const vendor = LlamaDeviceVram.vendorOf(device.name);
      const hits = [...freeAdapters].filter((a) => a.vendor === vendor && tokens.some((t) => LlamaDeviceVram._words(a).includes(t)));
      if (hits.length !== 1) continue;
      const adapter = hits[0];
      pairs.push([adapter, device]);
      freeAdapters.delete(adapter);
      freeDevices.delete(device);
    }
    for (const vendor of LlamaDeviceVram.FILLABLE_VENDORS) {
      const a = [...freeAdapters].filter((x) => x.vendor === vendor);
      const d = [...freeDevices].filter((x) => LlamaDeviceVram.vendorOf(x.name) === vendor);
      if (a.length === 1 && d.length === 1) pairs.push([a[0], d[0]]);
    }
    return pairs;
  }

  static _fill(adapter, device) {
    adapter.vramTotalBytes = device.totalBytes;
    adapter.vramFreeBytes = device.freeBytes > 0 ? device.freeBytes : null;
    adapter.vramSource = LlamaDeviceVram.SOURCE;
    adapter.llamaDevice = device.id;
    if (!adapter.displayName) adapter.displayName = device.name;
  }

  static _modelTokens(name) {
    return LlamaDeviceVram._normalize(name).split(' ').filter((w) => /\d/.test(w) && w.length >= 3);
  }

  static _words(adapter) {
    return ` ${LlamaDeviceVram._normalize(`${adapter.displayName || ''} ${adapter.deviceString || ''}`)} `.split(' ');
  }

  static _normalize(text) {
    return String(text || '').toLowerCase().replace(/\((r|tm)\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
  }
}

module.exports = LlamaDeviceVram;
