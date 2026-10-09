const os = require('os');
const PlacementLayout = require('../shared/runtime/PlacementLayout');
const PlacementStore = require('../shared/runtime/placement/PlacementStore');
const HotswapCoordinator = require('../shared/runtime/HotswapCoordinator');
const HotswapRamGate = require('../shared/runtime/HotswapRamGate');
const VramCoordinator = require('../shared/runtime/VramCoordinator');
const CudaDeviceProbe = require('../shared/runtime/CudaDeviceProbe');
const ProcessMemory = require('../shared/runtime/ProcessMemory');
const MusicModelCatalog = require('../music-server/models/MusicModelCatalog');
const BestEffort = require('./service/BestEffort');
const PlacementServers = require('./service/PlacementServers');
const MeasuredFootprintStore = require('./service/MeasuredFootprintStore');
const PlacementGate = require('./service/PlacementGate');
const HotswapWiring = require('./service/HotswapWiring');
const PoolModels = require('./service/PoolModels');
const PoolPrewarmer = require('./service/PoolPrewarmer');
const VramSnapshotBuilder = require('./service/VramSnapshotBuilder');
const PlacementSlotInfo = require('./service/PlacementSlotInfo');
const VramPeakSampler = require('./service/VramPeakSampler');
const MeasuredFootprintRecorder = require('./service/MeasuredFootprintRecorder');
const PlacementTestRun = require('./service/PlacementTestRun');
const PlacementLifecycle = require('./service/PlacementLifecycle');

class PlacementService {
  constructor(deps = {}) {
    if (!deps.settingsDb) throw new Error('PlacementService requires settingsDb');
    this._db = deps.settingsDb;
    this._setupCollaborators(deps);
    this._hotswapWiring.wire();
  }


  getConfig() {
    const layout = PlacementStore.load(this._db);
    return {
      layout,
      measured: this.getMeasured(),
      measuredCurrent: this._gate.measuredCurrent(),
      canApply: this._gate.canApply(layout),
      autoStart: !!layout.autoStart,
      autoStopMs: layout.autoStopMs,
    };
  }

  setConfig(patch = {}) {
    const layout = PlacementStore.save(this._db, PlacementService._patched(PlacementStore.load(this._db), patch));
    this._servers.applyAutoStop(layout.autoStopMs);
    this._hotswapWiring.applyPools(layout);
    if (PlacementLayout.hotswapPools(layout).length) this._prewarmer.prewarmInBackground();
    return this.getConfig();
  }

  autoArrange() {
    const layout = PlacementLayout.emptyLayout();
    PlacementStore.save(this._db, layout);
    this._hotswapWiring.applyPools(layout);
    return this.getConfig();
  }

  getMeasured() {
    return this._measuredStore.all();
  }

  isAvailable() {
    return this._servers.isAvailable();
  }


  async getHotswapInfo() {
    const totalBytes = this._totalMemory();
    const models = await this._poolModels.sizes();
    const { poolBytes, reserveBytes, requiredBytes, viable } = HotswapRamGate.evaluate({
      ramTotalBytes: totalBytes,
      poolBytes: PlacementLayout.ITEM_KEYS.map((item) => models[item]),
    });
    return {
      totalBytes, poolBytes, requiredBytes, reserveBytes, viable,
      suggestedCard: this._largestCardIndex(), models, estimated: !!models._estimated,
    };
  }


  async getVramSnapshot() {
    return this._snapshotBuilder.build();
  }


  startAll() {
    return this._lifecycle.startAll();
  }

  stopAll() {
    return this._lifecycle.stopAll();
  }

  async maybeAutoStart() {
    const config = this.getConfig();
    this._servers.applyAutoStop(config.autoStopMs);
    if (!config.autoStart || !this.isAvailable()) return { success: true, started: false };
    await this.startAll();
    return { success: true, started: true };
  }


  runTest(send) {
    return this._testRun.run(send);
  }


  _setupCollaborators(deps) {
    const seams = PlacementService._seams(deps);
    this._totalMemory = seams.totalMemory;
    this._gpu = seams.gpu;
    this._servers = new PlacementServers(deps);
    this._measuredStore = new MeasuredFootprintStore(this._db);
    this._gate = new PlacementGate({ servers: this._servers, measuredStore: this._measuredStore, musicCatalog: seams.musicCatalog });
    this._hotswapWiring = new HotswapWiring({ servers: this._servers, hotswap: seams.hotswap, settingsDb: this._db });
    this._poolModels = new PoolModels({ servers: this._servers, imageScanner: seams.imageScanner, musicCatalog: seams.musicCatalog });
    this._prewarmer = new PoolPrewarmer({ poolModels: this._poolModels });
    this._snapshotBuilder = new VramSnapshotBuilder({ servers: this._servers, gpu: seams.gpu, vram: seams.vram, getSharingClient: seams.getSharingClient });
    this._lifecycle = new PlacementLifecycle({
      servers: this._servers, settingsDb: this._db, gate: this._gate, prewarmer: this._prewarmer, getLauncher: seams.getLauncher,
    });
    this._testRun = this._createTestRun(deps, seams);
  }

  _createTestRun(deps, seams) {
    const slotInfo = new PlacementSlotInfo({ servers: this._servers, gpu: seams.gpu, vram: seams.vram });
    const recorder = new MeasuredFootprintRecorder({ servers: this._servers, measuredStore: this._measuredStore, slotInfo, vram: seams.vram });
    const getAgentDeps = typeof deps.getAgentDeps === 'function' ? deps.getAgentDeps : () => null;
    return new PlacementTestRun({
      getChatRouter: seams.getChatRouter,
      getArtifactStore: () => { const agentDeps = getAgentDeps(); return agentDeps && agentDeps.artifactStore; },
      createSampler: () => new VramPeakSampler({ servers: this._servers, gpu: seams.gpu, vram: seams.vram, rss: seams.rss }).start(),
      recorder,
      slotInfo,
      finalState: () => ({ measured: this.getMeasured(), canApply: this._gate.canApply(PlacementStore.load(this._db)) }),
    });
  }

  _largestCardIndex() {
    const cards = BestEffort.read(() => this._gpu.readDevices(null)) || [];
    if (!cards.length) return null;
    return cards.slice().sort((a, b) => b.totalBytes - a.totalBytes)[0].index;
  }

  static _patched(layout, patch) {
    let next = layout;
    if (patch.layout !== undefined) next = PlacementLayout.normalizeLayout(patch.layout);
    if (patch.autoStart !== undefined) next.autoStart = !!patch.autoStart;
    if (patch.autoStopMs !== undefined) next.autoStopMs = Math.max(0, Math.floor(Number(patch.autoStopMs) || 0));
    return next;
  }

  static _seams(deps) {
    return {
      getChatRouter: deps.getChatRouter || (() => global.__lumaChatRouter || null),
      getSharingClient: deps.getSharingClient || (() => global.__lumaSharingClientService || null),
      hotswap: deps.hotswap || HotswapCoordinator.shared,
      vram: deps.vram || VramCoordinator.shared,
      gpu: deps.gpu || CudaDeviceProbe,
      rss: deps.rss || ProcessMemory,
      totalMemory: deps.totalMemory || (() => os.totalmem()),
      musicCatalog: deps.musicCatalog || new MusicModelCatalog(),
      imageScanner: deps.imageScanner || PlacementService._lazyImageScanner(),
      getLauncher: deps.getLauncher || (() => require('../llm-server/server/ServerLauncher').shared),
    };
  }

  static _lazyImageScanner() {
    let scanner = null;
    return {
      scan: (dir) => {
        if (!scanner) scanner = new (require('../image-server/ImageModelsScanner'))();
        return scanner.scan(dir);
      },
    };
  }
}

module.exports = PlacementService;
