const PnpDisplayDevices = require('./PnpDisplayDevices');
const PcieAspm = require('./PcieAspm');

class GpuHealthProbe {
  static async probe(gpu) {
    const rows = await PnpDisplayDevices.list();
    if (rows == null) return { available: false, reason: 'Get-PnpDevice unavailable or returned no parseable data' };
    const devices = GpuHealthProbe.classify(rows, gpu);
    const faultedCount = devices.filter((d) => !d.isHealthy).length;
    return {
      available: true,
      source: 'pnp',
      devices,
      total: devices.length,
      healthyCount: devices.length - faultedCount,
      faultedCount,
      pcieAspm: faultedCount > 0 ? await PcieAspm.read() : null,
    };
  }

  static classify(rows, gpu) {
    const chromiumNames = GpuHealthProbe._chromiumNames(gpu);
    return rows
      .map((row) => GpuHealthProbe._toDevice(row, chromiumNames))
      .filter(Boolean);
  }

  static _toDevice(row, chromiumNames) {
    const name = (row.FriendlyName || '').trim();
    const instanceId = (row.InstanceId || '').trim();
    if (!instanceId || PnpDisplayDevices.isNonGpu(name)) return null;
    const status = String(row.Status || 'Unknown').toUpperCase();
    const isHealthy = status === 'OK';
    return {
      instanceId,
      name: name || instanceId,
      status,
      present: row.Present === true || row.Present === 'True',
      isHealthy,
      recoverable: !isHealthy,
      invisibleToApp: !isHealthy && !chromiumNames.has(name.toLowerCase()),
    };
  }

  static _chromiumNames(gpu) {
    const adapters = (gpu && Array.isArray(gpu.adapters)) ? gpu.adapters : [];
    return new Set(adapters.map((a) => (a.displayName || a.deviceString || '').toLowerCase()).filter(Boolean));
  }
}

module.exports = GpuHealthProbe;
