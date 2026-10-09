const HostProbe = require('./HostProbe');
const CudaProbe = require('./CudaProbe');
const GpuAdapterMatcher = require('./GpuAdapterMatcher');
const RegistryVramProbe = require('./RegistryVramProbe');
const GpuProbe = require('./GpuProbe');
const GpuHealthProbe = require('./GpuHealthProbe');
const DiskProbe = require('./DiskProbe');
const RamModuleProbe = require('./RamModuleProbe');
const ResourceBudget = require('./ResourceBudget');

class DiagnosticsGatherer {
  static gather(options) {
    return new DiagnosticsGatherer(options).gather();
  }

  constructor({ savedNvidiaSmiPath } = {}) {
    this._savedNvidiaSmiPath = savedNvidiaSmiPath;
  }

  async gather() {
    await this._probeCuda();
    await this._probeWindowsRegistryVram();
    await this._probeGpuDisksAndRamModules();
    await this._probeWindowsGpuHealth();
    this._readMemory();
    return this._buildReport();
  }

  async _probeCuda() {
    this._cuda = await CudaProbe.probe({ savedNvidiaSmiPath: this._savedNvidiaSmiPath });
  }

  async _probeWindowsRegistryVram() {
    this._winRegistryVram = process.platform === 'win32' ? await RegistryVramProbe.probe() : null;
  }

  async _probeGpuDisksAndRamModules() {
    [this._gpu, this._disks, this._ramModules] = await Promise.all([
      GpuProbe.probe({
        nvidiaByName: GpuAdapterMatcher.indexNvidiaByName(this._cuda),
        nvidiaByPci: GpuAdapterMatcher.indexNvidiaByPci(this._cuda),
        winRegistryVram: this._winRegistryVram,
      }),
      DiskProbe.probe(),
      RamModuleProbe.probe(),
    ]);
  }

  async _probeWindowsGpuHealth() {
    if (process.platform === 'win32') this._gpu.health = await GpuHealthProbe.probe(this._gpu);
  }

  _readMemory() {
    this._memory = HostProbe.memory();
    this._memory.modules = this._ramModules;
  }

  _buildReport() {
    return {
      timestamp: new Date().toISOString(),
      platform: HostProbe.platform(),
      memory: this._memory,
      cpu: HostProbe.cpu(),
      gpu: this._gpu,
      cuda: this._cuda,
      disks: this._disks,
      budget: ResourceBudget.compute(this._memory, this._gpu, this._cuda),
    };
  }
}

module.exports = DiagnosticsGatherer;
