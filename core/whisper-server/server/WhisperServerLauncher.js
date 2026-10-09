const path = require('path');
const BinaryLookup = require('../../shared/runtime/BinaryLookup');
const RuntimeManifest = require('../../shared/runtime/RuntimeManifest');
const WhisperRuntimeCatalog = require('../runtimes/WhisperRuntimeCatalog');
const WhisperLaunchPlanner = require('./WhisperLaunchPlanner');
const WhisperRuntimeServer = require('./WhisperRuntimeServer');

class WhisperServerLauncher {
  static RUNTIME_PREFERENCE = ['whisper-cpp-cublas', 'whisper-cpp-cpu'];
  static SEARCH_DEPTH = 3;
  static NO_MODEL_MESSAGE = 'No speech-to-text model installed. Download one in the voice setup.';
  static RUNTIME_MISSING_MESSAGE = 'The whisper.cpp runtime is not installed yet.';

  constructor({
    catalog = new WhisperRuntimeCatalog(),
    planner = new WhisperLaunchPlanner(),
    findFreePort = () => WhisperRuntimeServer.findFreePort(),
  } = {}) {
    this._catalog = catalog;
    this._planner = planner;
    this._findFreePort = findFreePort;
  }

  async resolveLaunch({ runtimesRoot, modelPath, language, threads } = {}) {
    await this._requireModel(modelPath);
    const runtime = await this._requireRuntime(runtimesRoot);
    const port = await this._findFreePort();
    const launch = this._planner.plan({ binaryPath: runtime.binaryPath, modelPath, port, language, threads });
    launch.plan.runtimeId = runtime.id;
    return launch;
  }

  async findInstalledRuntime(runtimesRoot) {
    for (const id of WhisperServerLauncher.RUNTIME_PREFERENCE) {
      const binaryPath = await this.findRuntimeBinary(runtimesRoot, id);
      if (binaryPath) return { id, binaryPath };
    }
    return null;
  }

  async findRuntimeBinary(runtimesRoot, id) {
    const entry = this._catalog.getById(id);
    if (!entry) return null;
    const dir = path.join(runtimesRoot, id);
    const located = await this._locatedBinary(dir);
    if (located) return located;
    return BinaryLookup.findBinaryIn(dir, this._catalog.getBinaryNames(entry), { maxDepth: WhisperServerLauncher.SEARCH_DEPTH });
  }

  async _requireModel(modelPath) {
    if (modelPath && await BinaryLookup.pathExists(modelPath)) return;
    throw WhisperServerLauncher._codedError(WhisperServerLauncher.NO_MODEL_MESSAGE, { code: 'NO_STT_MODEL' });
  }

  async _requireRuntime(runtimesRoot) {
    const runtime = await this.findInstalledRuntime(runtimesRoot);
    if (runtime) return runtime;
    throw WhisperServerLauncher._codedError(WhisperServerLauncher.RUNTIME_MISSING_MESSAGE, { code: 'STT_RUNTIME_MISSING', installable: true });
  }

  async _locatedBinary(dir) {
    const manifest = await RuntimeManifest.read(dir);
    const binaryPath = manifest && manifest.binaryPath;
    if (binaryPath && await BinaryLookup.pathExists(binaryPath)) return binaryPath;
    return null;
  }

  static _codedError(message, fields) {
    return Object.assign(new Error(message), fields);
  }
}

module.exports = WhisperServerLauncher;
