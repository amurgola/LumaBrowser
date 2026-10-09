const os = require('os');
const PlanFor = require('./PlanFor');
const LlmRuntimeServer = require('./LlmRuntimeServer');
const RpcPeers = require('./RpcPeers');
const LlmRuntimeCatalog = require('../runtimes/LlmRuntimeCatalog');
const LlmRuntimeDetector = require('../runtimes/LlmRuntimeDetector');
const LlmModelsScanner = require('../LlmModelsScanner');
const SystemDiagnostics = require('../SystemDiagnostics');
const VramCoordinator = require('../../shared/runtime/VramCoordinator');
const HotswapCoordinator = require('../../shared/runtime/HotswapCoordinator');
const LaunchPreflight = require('./launcher/LaunchPreflight');
const PeerGpuBorrow = require('./launcher/PeerGpuBorrow');
const LlmPlacement = require('./launcher/LlmPlacement');
const LaunchFinalizer = require('./launcher/LaunchFinalizer');
const FlagRescue = require('./launcher/FlagRescue');
const OomRescue = require('./launcher/OomRescue');
const LaunchRun = require('./launcher/LaunchRun');

class ServerLauncher {
  static shared = new ServerLauncher();

  constructor({
    planFor = PlanFor.shared,
    catalog = LlmRuntimeCatalog.shared,
    detector = LlmRuntimeDetector.shared,
    scanner = LlmModelsScanner.shared,
    diagnostics = SystemDiagnostics,
    vram = VramCoordinator.shared,
    hotswap = HotswapCoordinator.shared,
    rpcPeers = RpcPeers,
    findFreePort = () => LlmRuntimeServer.findFreePort(),
    freeMemory = () => os.freemem(),
    lending = () => global.__lumaRpcLending,
    log = console,
  } = {}) {
    const finalizer = new LaunchFinalizer({ vram });
    const placement = new LlmPlacement({ vram });
    this._parts = {
      planFor, catalog, hotswap, findFreePort, freeMemory, lending, log,
      preflight: new LaunchPreflight({ diagnostics, detector, scanner, catalog }),
      borrow: new PeerGpuBorrow({ rpcPeers, log }),
      placement,
      finalizer,
      flagRescue: new FlagRescue({ finalizer, log }),
      oomRescue: new OomRescue({ placement, log }),
    };
  }

  async resolveAndStart(llmServerService, { withVision = false } = {}) {
    return new LaunchRun(this._parts, llmServerService, { withVision }).execute();
  }
}

module.exports = ServerLauncher;
