const AutoPlanner = require('../models/AutoPlanner');
const CuratedModelCatalog = require('../models/CuratedModelCatalog');
const CudaDeviceProbe = require('../../shared/runtime/CudaDeviceProbe');
const ImageModelCatalog = require('../../image-server/models/ImageModelCatalog');
const MusicModelCatalog = require('../../music-server/models/MusicModelCatalog');
const PlannedBytesOnDisk = require('./PlannedBytesOnDisk');

class AutoSetupPlan {
  constructor({
    llmServerService, deps, wizard, planner = new AutoPlanner(), onDisk = null, platform = process.platform,
    readDevices = (diag) => CudaDeviceProbe.readDevices(diag), imageModels = () => new ImageModelCatalog().list(),
    musicModels = () => new MusicModelCatalog().list(),
  }) {
    this._deps = deps;
    this._wizard = wizard;
    this._planner = planner;
    this._onDisk = onDisk || new PlannedBytesOnDisk({ llmServerService, imageServerService: () => deps.imageServerService() });
    this._platform = platform;
    this._readDevices = readDevices;
    this._imageModels = imageModels;
    this._musicModels = musicModels;
  }

  async plan(opts) {
    const diagOut = {};
    const hardware = await this._wizard.hardware(diagOut);
    const plan = this._planner.plan({
      hw: hardware,
      devices: AutoSetupPlan._safe(() => this._readDevices(diagOut.diag), []) || [],
      wantImage: !!(opts && opts.wantImage),
      wantMusic: !!(opts && opts.wantMusic),
      llmModels: CuratedModelCatalog.MODELS,
      imageModels: AutoSetupPlan._safe(this._imageModels, []),
      musicModels: AutoSetupPlan._safe(this._musicModels, []),
      musicEligibility: await this._musicEligibility(opts),
    });
    if (plan && plan.llm) plan.onDisk = await this._onDiskOrNull(plan);
    return { hardware, plan };
  }

  async _musicEligibility(opts) {
    if (this._platform !== 'win32') return { wslReady: true };
    if (!(opts && opts.wantMusic)) return { wslReady: false };
    try {
      const service = this._deps.get('musicServerService');
      const view = service ? await service.ensureRuntimesView() : null;
      const row = view && Array.isArray(view.runtimes) && view.runtimes[0];
      return { wslReady: !!(row && row.wsl && row.wsl.wsl2 && row.wsl.nvidiaDriverOk) };
    } catch (_) {
      return { wslReady: false };
    }
  }

  async _onDiskOrNull(plan) {
    try {
      return await this._onDisk.measure(plan);
    } catch (_) {
      return null;
    }
  }

  static _safe(fn, fallback) {
    try {
      return fn();
    } catch (_) {
      return fallback;
    }
  }
}

module.exports = AutoSetupPlan;
