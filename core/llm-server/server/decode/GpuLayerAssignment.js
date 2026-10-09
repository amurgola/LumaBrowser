class GpuLayerAssignment {
  static assign({ firstGpuLayer, blocks, perGpu, layerFill, cpuMoeSplit }) {
    const owner = new Array(blocks).fill(-1);
    const offloaded = blocks - firstGpuLayer;
    if (offloaded <= 0 || !Array.isArray(perGpu) || perGpu.length === 0) return owner;
    const counts = GpuLayerAssignment._layerCounts(offloaded, perGpu, layerFill, cpuMoeSplit);
    GpuLayerAssignment._fillContiguousRuns(owner, firstGpuLayer, counts);
    return owner;
  }

  static _layerCounts(offloaded, perGpu, layerFill, cpuMoeSplit) {
    const planned = GpuLayerAssignment._plannedCounts(perGpu.length, layerFill, cpuMoeSplit, offloaded);
    if (planned && GpuLayerAssignment._sum(planned) === offloaded) return planned;
    return GpuLayerAssignment._proportionalCounts(offloaded, perGpu);
  }

  static _plannedCounts(deviceCount, layerFill, cpuMoeSplit, offloaded) {
    if (layerFill && Array.isArray(layerFill.perDevice) && layerFill.perDevice.length === deviceCount) {
      return layerFill.perDevice.map((d) => GpuLayerAssignment._wholeCount(d && d.layers));
    }
    if (typeof cpuMoeSplit === 'string' && cpuMoeSplit) {
      const parts = cpuMoeSplit.split(',').map((s) => GpuLayerAssignment._wholeCount(s));
      if (parts.length === deviceCount && GpuLayerAssignment._sum(parts) === offloaded) return parts;
    }
    return null;
  }

  static _proportionalCounts(offloaded, perGpu) {
    const sizes = perGpu.map((g) => Math.max(1, Number(g && g.totalBytes) || 0));
    const total = GpuLayerAssignment._sum(sizes);
    const counts = sizes.map((s) => Math.floor((offloaded * s) / total));
    let left = offloaded - GpuLayerAssignment._sum(counts);
    for (let i = 0; left > 0; i = (i + 1) % counts.length) {
      counts[i] += 1;
      left -= 1;
    }
    return counts;
  }

  static _fillContiguousRuns(owner, firstGpuLayer, counts) {
    let layer = firstGpuLayer;
    for (let device = 0; device < counts.length; device++) {
      for (let k = 0; k < counts[device] && layer < owner.length; k++) owner[layer++] = device;
    }
    while (layer < owner.length) owner[layer++] = counts.length - 1;
  }

  static _wholeCount(value) {
    return Math.max(0, Math.floor(Number(value) || 0));
  }

  static _sum(values) {
    return values.reduce((a, b) => a + b, 0);
  }
}

module.exports = GpuLayerAssignment;
