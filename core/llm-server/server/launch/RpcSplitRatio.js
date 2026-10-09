const CudaDeviceProbe = require('../../../shared/runtime/CudaDeviceProbe');
const GpuOverhead = require('./GpuOverhead');
const GpuInventory = require('./GpuInventory');

class RpcSplitRatio {
  static MIB = 1024 * 1024;

  static DEVICE_RESERVE = 2 * 1024 * 1024 * 1024;

  static TRIM_MARGIN = 1.05;

  static compute(rpcServers, diagnostics, localAdapterCount, needBytes) {
    const remote = RpcSplitRatio._remoteUsable(rpcServers);
    if (!remote || !remote.length) return null;
    const local = RpcSplitRatio._localUsable(diagnostics, localAdapterCount);
    if (!local) return null;
    const parts = [...RpcSplitRatio._trimRemote(remote, local, needBytes), ...local]
      .map((b) => Math.round(b / RpcSplitRatio.MIB));
    if (!parts.some((p) => p > 0)) return null;
    return parts.join(',');
  }

  static _remoteUsable(rpcServers) {
    const remote = [];
    for (const server of rpcServers) {
      if (!Array.isArray(server.devices) || !server.devices.length) return null;
      for (const d of server.devices) remote.push(Math.max(0, GpuInventory.usableRemoteBytes(d) - RpcSplitRatio.DEVICE_RESERVE));
    }
    return remote;
  }

  static _localUsable(diagnostics, localAdapterCount) {
    let rows = [];
    try { rows = CudaDeviceProbe.readDevices(diagnostics); } catch (_) { rows = []; }
    if (rows.length !== localAdapterCount) return null;
    return rows.map((d) => {
      const free = d.freeBytes != null ? Number(d.freeBytes) : (Number(d.totalBytes) || 0);
      return Math.max(0, free - GpuOverhead.PER_CARD_RESERVE);
    });
  }

  static _trimRemote(remote, local, needBytes) {
    const used = remote.slice();
    if (!(Number(needBytes) > 0)) return used;
    const target = Number(needBytes) * RpcSplitRatio.TRIM_MARGIN;
    let cumulative = local.reduce((s, b) => s + b, 0);
    for (let i = 0; i < used.length; i++) {
      if (cumulative >= target) { used[i] = 0; continue; }
      cumulative += used[i];
    }
    return used;
  }
}

module.exports = RpcSplitRatio;
