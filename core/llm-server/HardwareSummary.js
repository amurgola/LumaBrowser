class HardwareSummary {
  static GIB = 1024 * 1024 * 1024;
  static MIB = 1024 * 1024;

  static NAME_NOISE = [
    /^NVIDIA\s+GeForce\s+/i,
    /^NVIDIA\s+/i,
    /^AMD\s+Radeon\s+/i,
    /^AMD\s+/i,
    /^Intel\(R\)\s+/i,
    /^Intel\s+/i,
    /\(TM\)/gi,
    /\(R\)/gi,
  ];

  static summarize(diagnostics) {
    const parts = [];
    const ram = HardwareSummary._ramPart(diagnostics);
    if (ram) parts.push(ram);
    const gpus = HardwareSummary._countGpus(HardwareSummary._gpuList(diagnostics));
    if (gpus) parts.push(gpus);
    else if (parts.length) parts.push('no GPU detected');
    return parts.join(' · ');
  }

  static shortGpuName(raw) {
    let name = String(raw || '').trim();
    if (!name) return '';
    for (const noise of HardwareSummary.NAME_NOISE) name = name.replace(noise, '');
    return name.replace(/\s+/g, ' ').trim() || String(raw).trim();
  }

  static _ramPart(diagnostics) {
    const ramBytes = Number(diagnostics && diagnostics.memory && diagnostics.memory.totalBytes) || 0;
    return ramBytes > 0 ? `${Math.round(ramBytes / HardwareSummary.GIB)} GB RAM` : '';
  }

  static _gpuList(diagnostics) {
    return HardwareSummary._fromBudget(diagnostics)
      || HardwareSummary._fromCuda(diagnostics)
      || HardwareSummary._fromChromium(diagnostics)
      || [];
  }

  static _fromBudget(diagnostics) {
    const vram = diagnostics && diagnostics.budget && diagnostics.budget.vram;
    if (!vram || !Array.isArray(vram.perAdapter) || !vram.perAdapter.length) return null;
    return HardwareSummary._named(vram.perAdapter.map((a) => ({
      name: HardwareSummary.shortGpuName(a.name),
      totalBytes: Number(a.totalBytes) || 0,
    })));
  }

  static _fromCuda(diagnostics) {
    const cuda = diagnostics && diagnostics.cuda;
    if (!cuda || !cuda.available || !Array.isArray(cuda.devices) || !cuda.devices.length) return null;
    return HardwareSummary._named(cuda.devices.map((d) => ({
      name: HardwareSummary.shortGpuName(d.name),
      totalBytes: (Number(d.memoryTotalMB) || 0) * HardwareSummary.MIB,
    })));
  }

  static _fromChromium(diagnostics) {
    const gpu = diagnostics && diagnostics.gpu;
    if (!gpu || !Array.isArray(gpu.adapters) || !gpu.adapters.length) return null;
    return HardwareSummary._named(gpu.adapters
      .filter((a) => a && a.vendor !== 'Microsoft')
      .map((a) => ({
        name: HardwareSummary.shortGpuName(a.displayName || a.deviceString),
        totalBytes: Number(a.vramTotalBytes) || 0,
      })));
  }

  static _named(list) {
    return list.filter((g) => g.name);
  }

  static _countGpus(list) {
    if (!list.length) return '';
    const counts = new Map();
    for (const gpu of list) counts.set(gpu.name, (counts.get(gpu.name) || 0) + 1);
    return Array.from(counts, ([name, count]) => `${count}× ${name}`).join(', ');
  }
}

module.exports = HardwareSummary;
