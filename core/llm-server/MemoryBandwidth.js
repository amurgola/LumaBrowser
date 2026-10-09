class MemoryBandwidth {
  static GIB = 1024 * 1024 * 1024;

  static GPU_BANDWIDTH_GBPS = [
    ['5090', 1792], ['5080', 960], ['5070 ti', 896], ['5070', 672], ['5060 ti', 448], ['5060', 448],
    ['4090', 1008], ['4080', 717], ['4070 ti', 672], ['4070', 504], ['4060 ti', 288], ['4060', 272],
    ['3090 ti', 1008], ['3090', 936], ['3080 ti', 912], ['3080', 760], ['3070', 448],
    ['3060 ti', 448], ['3060', 360],
    ['2080 ti', 616], ['2080', 448], ['2070', 448], ['2060', 336],
    ['h200', 4800], ['h100', 3350], ['a100', 1555], ['l40', 864], ['a6000', 768], ['a5000', 768],
    ['a4000', 448], ['v100', 900], ['rtx 6000', 960],
    ['7900 xtx', 960], ['7900 xt', 800], ['7800 xt', 624], ['7700 xt', 432],
    ['6900', 512], ['6800', 512], ['6700', 384], ['mi300', 5300], ['w7900', 864],
    ['b580', 456], ['a770', 560], ['a750', 512],
  ];

  static GPU_BANDWIDTH_FLOOR = [
    [40 * MemoryBandwidth.GIB, 600],
    [20 * MemoryBandwidth.GIB, 400],
    [12 * MemoryBandwidth.GIB, 250],
    [6 * MemoryBandwidth.GIB, 150],
    [0, 80],
  ];

  static INTEGRATED_GPU_FLOOR_GBPS = 50;
  static INTEGRATED_GPU = /integrated|iris|uhd graphics|radeon graphics|radeon\(tm\) graphics|vega \d|apple m\d/i;

  static RAM_CHANNELS_MAX = 2;
  static RAM_FLOOR_GBPS = { ddr5: 60, ddr4: 35, lpddr5: 60, lpddr4: 30, unknown: 30 };
  static APPLE_UNIFIED_FLOOR_GBPS = 68;

  static tableGpuBandwidth(name) {
    if (!name) return 0;
    const lower = String(name).toLowerCase();
    const hit = MemoryBandwidth.GPU_BANDWIDTH_GBPS.find(([needle]) => lower.includes(needle));
    return hit ? hit[1] : 0;
  }

  static resolveGpuBandwidth(device) {
    const d = device || {};
    if (Number(d.bandwidthGbps) > 0) return { gbps: Number(d.bandwidthGbps), source: 'reported' };
    const fromTable = MemoryBandwidth.tableGpuBandwidth(d.name);
    if (fromTable > 0) return { gbps: fromTable, source: 'table' };
    return { gbps: MemoryBandwidth._gpuFloor(d), source: 'floor' };
  }

  static resolveRamBandwidth(memory, platform = process.platform) {
    if (platform === 'darwin') return { gbps: MemoryBandwidth.APPLE_UNIFIED_FLOOR_GBPS, source: 'floor' };
    const modules = (memory && Array.isArray(memory.modules)) ? memory.modules.filter(Boolean) : [];
    const fromModules = MemoryBandwidth._ramFromModuleSpeeds(modules);
    if (fromModules) return { gbps: fromModules, source: 'modules' };
    return { gbps: MemoryBandwidth.RAM_FLOOR_GBPS[MemoryBandwidth._ramTypeKey(modules)], source: 'floor' };
  }

  static _gpuFloor(device) {
    if (MemoryBandwidth.INTEGRATED_GPU.test(String(device.name || ''))) return MemoryBandwidth.INTEGRATED_GPU_FLOOR_GBPS;
    const total = Number(device.totalBytes) || 0;
    const floors = MemoryBandwidth.GPU_BANDWIDTH_FLOOR;
    const hit = floors.find(([minBytes]) => total >= minBytes);
    return hit ? hit[1] : floors[floors.length - 1][1];
  }

  static _ramFromModuleSpeeds(modules) {
    const speeds = modules
      .map((m) => Number(m.configuredSpeedMTs) || Number(m.speedMTs) || 0)
      .filter((s) => s > 0);
    if (!speeds.length) return 0;
    const channels = Math.min(MemoryBandwidth.RAM_CHANNELS_MAX, Math.max(1, modules.length));
    return Math.round(channels * 8 * Math.min(...speeds) / 1000);
  }

  static _ramTypeKey(modules) {
    const type = String((modules[0] && modules[0].memoryType) || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (/lpddr5/.test(type)) return 'lpddr5';
    if (/lpddr4/.test(type)) return 'lpddr4';
    if (/ddr5/.test(type)) return 'ddr5';
    if (/ddr4/.test(type)) return 'ddr4';
    return 'unknown';
  }
}

module.exports = MemoryBandwidth;
