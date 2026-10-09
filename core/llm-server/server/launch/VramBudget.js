const GpuInventory = require('./GpuInventory');
const GpuOverhead = require('./GpuOverhead');

class VramBudget {
  static resolve({ diagnostics, overrides, flags }) {
    const budget = VramBudget._rpcPeers(overrides, flags);
    budget.perGpu = GpuInventory.fromDiagnostics(diagnostics);
    if (budget.rpcEnabled) budget.perGpu.push(...GpuInventory.remoteDevices(budget.rpcServers));
    budget.totalVram = budget.perGpu.reduce((s, g) => s + g.totalBytes, 0);
    budget.vramAvailableBytes = VramBudget._available(budget, overrides);
    VramBudget._resolveLargestCard(budget);
    return budget;
  }

  static _rpcPeers(overrides, flags) {
    const rpcServers = (Array.isArray(overrides.rpcServers) ? overrides.rpcServers : [])
      .filter((s) => s && typeof s.addr === 'string' && s.addr.includes(':'));
    return { rpcServers, rpcFlagSupported: flags.rpc, rpcEnabled: rpcServers.length > 0 && flags.rpc };
  }

  static _available(budget, overrides) {
    const reserve = budget.perGpu.length * GpuOverhead.PER_CARD_RESERVE;
    let available = Math.max(0, budget.totalVram - reserve);
    const cap = Number(overrides.vramCapBytes);
    if (Number.isFinite(cap) && cap > 0) available = Math.min(available, cap);
    return available;
  }

  static _resolveLargestCard(budget) {
    budget.largestGpuIndex = GpuInventory.largestIndex(budget.perGpu);
    budget.largestGpuUsableBytes = budget.largestGpuIndex >= 0
      ? Math.max(0, budget.perGpu[budget.largestGpuIndex].totalBytes - GpuOverhead.PER_CARD_RESERVE)
      : 0;
  }
}

module.exports = VramBudget;
