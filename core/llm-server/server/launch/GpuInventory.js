class GpuInventory {
  static MIB = 1024 * 1024;

  static fromDiagnostics(diagnostics) {
    const cuda = GpuInventory._cudaCards(diagnostics);
    return cuda.length > 0 ? cuda : GpuInventory._adapters(diagnostics);
  }

  static remoteDevices(rpcServers) {
    const out = [];
    for (const server of rpcServers) {
      const devices = Array.isArray(server.devices) && server.devices.length ? server.devices : null;
      if (devices) GpuInventory._pushRemoteDevices(out, server, devices);
      else GpuInventory._pushRemoteAggregate(out, server);
    }
    return out;
  }

  static largestIndex(perGpu) {
    if (!Array.isArray(perGpu) || perGpu.length === 0) return -1;
    let best = 0;
    for (let i = 1; i < perGpu.length; i++) {
      if (perGpu[i].totalBytes > perGpu[best].totalBytes) best = i;
    }
    return best;
  }

  static usableRemoteBytes(entry) {
    return Number(entry.freeBytes) > 0 ? Number(entry.freeBytes) : (Number(entry.totalBytes) || 0);
  }

  static _cudaCards(diagnostics) {
    const devices = (diagnostics && diagnostics.cuda && diagnostics.cuda.available && diagnostics.cuda.devices) || [];
    const out = [];
    for (const d of devices) {
      const totalBytes = (Number(d.memoryTotalMB) || 0) * GpuInventory.MIB;
      if (totalBytes <= 0) continue;
      const freeBytes = d.memoryFreeMB != null ? (Number(d.memoryFreeMB) || 0) * GpuInventory.MIB : null;
      out.push({ name: d.name || 'NVIDIA GPU', totalBytes, freeBytes });
    }
    return out;
  }

  static _adapters(diagnostics) {
    const adapters = diagnostics && diagnostics.gpu && Array.isArray(diagnostics.gpu.adapters) ? diagnostics.gpu.adapters : [];
    const out = [];
    for (const a of adapters) {
      if (!a || !a.vramTotalBytes || a.vramTotalBytes <= 0) continue;
      if (a.vendor === 'Microsoft') continue;
      out.push({ name: a.displayName || a.deviceString || a.vendor || 'GPU', totalBytes: a.vramTotalBytes });
    }
    return out;
  }

  static _pushRemoteDevices(out, server, devices) {
    for (const d of devices) {
      const usable = GpuInventory.usableRemoteBytes(d);
      if (usable > 0) out.push({ name: `${server.label || 'Peer'} GPU${d.index} (RPC ${server.addr})`, totalBytes: usable, remote: true });
    }
  }

  static _pushRemoteAggregate(out, server) {
    const usable = GpuInventory.usableRemoteBytes(server);
    if (usable > 0) out.push({ name: `${server.label || 'Peer'} (RPC ${server.addr})`, totalBytes: usable, remote: true });
  }
}

module.exports = GpuInventory;
