const fs = require('fs');
const path = require('path');
const PowerShellRunner = require('./PowerShellRunner');
const PowerShellJson = require('./PowerShellJson');
const IntelComputeRuntime = require('../../shared/runtime/detect/IntelComputeRuntime');

class NpuProbe {
  static ACCEL_ROOT = '/sys/class/accel';
  static VENDORS = { 0x8086: 'Intel', 0x1022: 'AMD', 0x1002: 'AMD', 0x17cb: 'Qualcomm' };
  static LINUX_NAMES = { intel_vpu: 'Intel NPU', amdxdna: 'AMD XDNA NPU' };
  static SCRIPT = `
    Get-CimInstance Win32_PnPEntity -Filter "PNPClass='ComputeAccelerator'" -ErrorAction SilentlyContinue |
      Select-Object Name, Manufacturer, Status, PNPDeviceID |
      ConvertTo-Json -Compress -Depth 3
  `;

  static USER_SPACE_MISSING = `Kernel driver bound, user-space driver missing: install ${IntelComputeRuntime.PACKAGES.npuDriver} and ${IntelComputeRuntime.PACKAGES.levelZeroLoader}`;

  static async probe({ platform = process.platform, fsLike = fs, runPowerShell = PowerShellRunner.run, intel = null } = {}) {
    if (platform === 'linux') return NpuProbe._summary(NpuProbe._linux(fsLike, intel || IntelComputeRuntime.probe({ platform, fsLike })));
    if (platform === 'win32') return NpuProbe._summary(await NpuProbe._windows(runPowerShell));
    return { available: false, reason: 'No NPU runtime on this platform' };
  }

  static hasIntelNpu(npu) {
    return NpuProbe.intelNpus(npu).length > 0;
  }

  static intelNpus(npu) {
    return npu && Array.isArray(npu.devices) ? npu.devices.filter((d) => d && d.vendor === 'Intel') : [];
  }

  static usableIntelNpus(npu) {
    return NpuProbe.intelNpus(npu).filter((d) => d.usable !== false);
  }

  static _summary(devices) {
    if (devices == null) return { available: false, reason: 'NPU probe failed' };
    return { available: devices.length > 0, devices };
  }

  static _linux(fsLike, intel) {
    let names;
    try {
      names = fsLike.readdirSync(NpuProbe.ACCEL_ROOT).filter((n) => /^accel\d+$/.test(n));
    } catch (_) {
      return [];
    }
    return names.map((name) => NpuProbe._readAccel(fsLike, `${NpuProbe.ACCEL_ROOT}/${name}/device`, intel)).filter(Boolean);
  }

  static _readAccel(fsLike, deviceDir, intel) {
    let vendorId = null;
    try { vendorId = parseInt(String(fsLike.readFileSync(`${deviceDir}/vendor`, 'utf8')).trim(), 16); } catch (_) { return null; }
    let driver = null;
    try { driver = path.posix.basename(fsLike.realpathSync(`${deviceDir}/driver`)); } catch (_) {}
    const vendor = NpuProbe.VENDORS[vendorId] || null;
    const name = NpuProbe.LINUX_NAMES[driver] || (vendor ? `${vendor} NPU` : 'NPU');
    const device = { vendor, name, driver, status: driver ? 'OK' : 'No driver', usable: !!driver };
    if (vendor === 'Intel' && driver) NpuProbe._stampIntelUserSpace(device, intel);
    return device;
  }

  static _stampIntelUserSpace(device, intel) {
    const ready = !!(intel && intel.npuDriver && intel.levelZeroLoader);
    device.usable = ready;
    if (!ready) device.status = NpuProbe.USER_SPACE_MISSING;
  }

  static async _windows(runPowerShell) {
    const result = await runPowerShell(NpuProbe.SCRIPT);
    if (!result || !result.ok) return null;
    const rows = PowerShellJson.parseRows(result.stdout);
    if (rows == null) return null;
    return rows.filter(Boolean).map((r) => ({
      vendor: NpuProbe._vendorFromPnp(r.PNPDeviceID) || r.Manufacturer || null,
      name: r.Name || 'NPU',
      driver: null,
      status: r.Status || null,
      usable: !r.Status || r.Status === 'OK',
    }));
  }

  static _vendorFromPnp(pnpId) {
    const match = /VEN_([0-9A-F]{4})/i.exec(String(pnpId || ''));
    return match ? (NpuProbe.VENDORS[parseInt(match[1], 16)] || null) : null;
  }
}

module.exports = NpuProbe;
