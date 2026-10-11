const HostProbe = require('./HostProbe');
const CudaProbe = require('./CudaProbe');
const GpuAdapterMatcher = require('./GpuAdapterMatcher');
const RegistryVramProbe = require('./RegistryVramProbe');
const LinuxDrmVramProbe = require('./LinuxDrmVramProbe');
const LlamaDeviceProbe = require('./LlamaDeviceProbe');
const LlamaDeviceVram = require('./LlamaDeviceVram');
const NpuProbe = require('./NpuProbe');
const UnifiedMemoryProbe = require('./UnifiedMemoryProbe');
const SharedGpuMemory = require('./SharedGpuMemory');
const GpuProbe = require('./GpuProbe');
const GpuHealthProbe = require('./GpuHealthProbe');
const DiskProbe = require('./DiskProbe');
const RamModuleProbe = require('./RamModuleProbe');
const ResourceBudget = require('./ResourceBudget');

class DiagnosticsGatherer {
  static gather(options) {
    return new DiagnosticsGatherer(options).gather();
  }

  constructor({ savedNvidiaSmiPath, runtimesRoot } = {}) {
    this._savedNvidiaSmiPath = savedNvidiaSmiPath;
    this._runtimesRoot = runtimesRoot || null;
  }

  async gather() {
    await this._probeCuda();
    await this._probeWindowsRegistryVram();
    this._probeLinuxDrm();
    await this._probeGpuDisksAndRamModules();
    await this._probeLlamaDevices();
    this._readMemory();
    await this._applySharedGpuMemory();
    await this._probeWindowsGpuHealth();
    return this._buildReport();
  }

  async _probeCuda() {
    this._cuda = await CudaProbe.probe({ savedNvidiaSmiPath: this._savedNvidiaSmiPath });
  }

  async _probeWindowsRegistryVram() {
    this._winRegistryVram = process.platform === 'win32' ? await RegistryVramProbe.probe() : null;
  }

  _probeLinuxDrm() {
    this._linuxDrm = LinuxDrmVramProbe.probe();
  }

  async _probeGpuDisksAndRamModules() {
    [this._gpu, this._disks, this._ramModules, this._npu] = await Promise.all([
      GpuProbe.probe({
        nvidiaByName: GpuAdapterMatcher.indexNvidiaByName(this._cuda),
        nvidiaByPci: GpuAdapterMatcher.indexNvidiaByPci(this._cuda),
        winRegistryVram: this._winRegistryVram,
        linuxDrm: this._linuxDrm,
      }),
      DiskProbe.probe(),
      RamModuleProbe.probe(),
      NpuProbe.probe().catch((e) => ({ available: false, reason: (e && e.message) || 'NPU probe failed' })),
    ]);
  }

  async _probeLlamaDevices() {
    if (process.platform !== 'linux' || !DiagnosticsGatherer._needsVram(this._gpu)) return;
    try {
      this._gpu = LlamaDeviceVram.apply(this._gpu, await LlamaDeviceProbe.probe({ runtimesRoot: this._runtimesRoot }));
    } catch (_) {}
  }

  static _needsVram(gpu) {
    return !!(gpu && Array.isArray(gpu.adapters)
      && gpu.adapters.some((a) => a && LlamaDeviceVram.FILLABLE_VENDORS.has(a.vendor) && !(a.vramTotalBytes > 0) && a.integrated !== true));
  }

  async _probeWindowsGpuHealth() {
    if (process.platform === 'win32') this._gpu.health = await GpuHealthProbe.probe(this._gpu);
  }

  _readMemory() {
    this._memory = HostProbe.memory();
    this._memory.modules = this._ramModules;
  }

  async _applySharedGpuMemory() {
    const totalRamBytes = this._memory.totalBytes;
    const unified = await UnifiedMemoryProbe.probe(totalRamBytes);
    this._gpu = SharedGpuMemory.apply(this._gpu, { totalRamBytes, unified, cudaAvailable: !!(this._cuda && this._cuda.available) });
  }

  _buildReport() {
    return {
      timestamp: new Date().toISOString(),
      platform: HostProbe.platform(),
      memory: this._memory,
      cpu: HostProbe.cpu(),
      gpu: this._gpu,
      npu: this._npu,
      cuda: this._cuda,
      disks: this._disks,
      budget: ResourceBudget.compute(this._memory, this._gpu, this._cuda),
    };
  }
}

module.exports = DiagnosticsGatherer;
