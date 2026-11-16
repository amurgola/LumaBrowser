const ExtensionGlobals = require('../../core/shell/extensions/ExtensionGlobals');
const ImageModelsScanner = require('../../core/image-server/ImageModelsScanner');
const ImageLoraLibrary = require('../../core/image-server/ipc/ImageLoraLibrary');
const ImageSlots = require('../../core/image-server/ipc/ImageSlots');
const ModelLoraAttacher = require('../../core/image-server/ipc/ModelLoraAttacher');

class TrainerImageHost {
  static NO_IMAGE_SERVER = 'The image server is not available on this build.';

  constructor({ globals = ExtensionGlobals, scanner = new ImageModelsScanner() } = {}) {
    this._globals = globals;
    this._scanner = scanner;
  }

  async installedModels() {
    const scan = await this._scanner.scan(this._service().getModelsDirConfig().effectivePath);
    return scan.models || [];
  }

  defaultGenerateModelId() {
    const defaults = this._service().getDefaults() || {};
    return defaults.modelId || null;
  }

  listLoras() {
    return this._library().list().loras;
  }

  importLora(filePath, meta) {
    return this._library().import(null, { path: filePath, meta });
  }

  setModelLoras(modelId, loras, preset = null) {
    const args = { id: modelId, loras, ...(preset ? { distilledPreset: true, preset } : {}) };
    return new ModelLoraAttacher({ imageServerService: this._service() }).attach(args);
  }

  async stopImageServers() {
    try { await new ImageSlots(this._service()).stopAll(); } catch (_) {}
  }

  artifact(id) {
    const router = this._globals.chatRouter();
    const deps = router && typeof router.getAgentDeps === 'function' ? router.getAgentDeps() : null;
    const store = deps && deps.artifactStore;
    return store ? store.get(id) : null;
  }

  _library() {
    return new ImageLoraLibrary({ imageServerService: this._service(), slot: null });
  }

  _service() {
    const service = this._globals.imageServerService();
    if (!service) throw new Error(TrainerImageHost.NO_IMAGE_SERVER);
    return service;
  }
}

module.exports = TrainerImageHost;
