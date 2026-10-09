const { ipcMain } = require('electron');
const IpcEnvelope = require('../shared/ipc/IpcEnvelope');
const PathPicker = require('../shared/ipc/PathPicker');
const SenderStream = require('../shared/ipc/SenderStream');
const ImageRouter = require('./ImageRouter');
const CatalogModelInstaller = require('./ipc/CatalogModelInstaller');
const ExistingModelAdopter = require('./ipc/ExistingModelAdopter');
const ImageDefaultsUpdater = require('./ipc/ImageDefaultsUpdater');
const ImageDownloadSlot = require('./ipc/ImageDownloadSlot');
const ImageGenerationRequests = require('./ipc/ImageGenerationRequests');
const ImageLoraLibrary = require('./ipc/ImageLoraLibrary');
const ImageModelImporter = require('./ipc/ImageModelImporter');
const ImageModelsView = require('./ipc/ImageModelsView');
const ImageRuntimeSetup = require('./ipc/ImageRuntimeSetup');
const ImageServerBroadcast = require('./ipc/ImageServerBroadcast');
const ImageServerConfigs = require('./ipc/ImageServerConfigs');
const ImageSlots = require('./ipc/ImageSlots');
const InstalledModelRemover = require('./ipc/InstalledModelRemover');
const ModelFileUpdater = require('./ipc/ModelFileUpdater');
const ModelLoraAttacher = require('./ipc/ModelLoraAttacher');

class ImageIpcHandlers {
  static MODEL_EVENT_CHANNEL = 'core.imageServer.modelEvent';
  static RUNTIME_EVENT_CHANNEL = 'core.imageServer.runtimeEvent';
  static IMAGE_EVENT_CHANNEL = 'core.imageServer.imageEvent';

  static register(service, { notify } = {}) {
    const router = new ImageRouter({ imageServerService: service, notify });
    const slot = new ImageDownloadSlot();
    const services = ImageIpcHandlers._services(service, router, slot);
    ImageServerBroadcast.wire(service.runtimeServer);
    ImageIpcHandlers._registerSetup(service, services);
    ImageIpcHandlers._registerRuntimes(services);
    ImageIpcHandlers._registerDefaultsAndServers(service, services);
    ImageIpcHandlers._registerModels(slot, services);
    ImageIpcHandlers._registerLoras(services);
    ImageIpcHandlers._registerImports(services);
    ImageIpcHandlers._registerGeneration(services);
    return { router };
  }

  static _services(service, router, slot) {
    return {
      models: new ImageModelsView({ imageServerService: service }),
      runtimes: new ImageRuntimeSetup({ imageServerService: service }),
      defaults: new ImageDefaultsUpdater(service),
      configs: new ImageServerConfigs(service),
      slots: new ImageSlots(service),
      installer: new CatalogModelInstaller({ imageServerService: service, slot }),
      loras: new ImageLoraLibrary({ imageServerService: service, slot }),
      attacher: new ModelLoraAttacher({ imageServerService: service }),
      importer: new ImageModelImporter({ imageServerService: service, slot }),
      adopter: new ExistingModelAdopter(service),
      remover: new InstalledModelRemover(service),
      updater: new ModelFileUpdater({ imageServerService: service, slot }),
      generations: new ImageGenerationRequests(router),
    };
  }

  static _registerSetup(service, { models }) {
    ImageIpcHandlers._handle('getEnabled', IpcEnvelope.raw(() => service.isEnabled()));
    ImageIpcHandlers._handle('setEnabled', IpcEnvelope.enveloped((_e, enabled) => service.setEnabled(enabled)));
    ImageIpcHandlers._handle('getModelsView', IpcEnvelope.enveloped(() => models.view()));
    ImageIpcHandlers._handle('setModelsDir', IpcEnvelope.enveloped((_e, dir) => models.setModelsDir(dir)));
    ImageIpcHandlers._handle('pickModelsDir', IpcEnvelope.enveloped((event) => ImageIpcHandlers._pickDir(event, {
      title: 'Choose image-models directory',
      properties: ['openDirectory', 'createDirectory'],
      defaultPath: service.getModelsDirConfig().effectivePath,
    })));
    ImageIpcHandlers._handle('getModelDisplayNames', IpcEnvelope.enveloped(() => ({ names: service.getModelDisplayNames() })));
    ImageIpcHandlers._handle('setModelDisplayName', IpcEnvelope.enveloped((_e, key, name) => ({ names: service.setModelDisplayName(key, name) })));
    ImageIpcHandlers._handle('setModelKind', IpcEnvelope.enveloped((_e, modelId, kind) => models.setKind(modelId, kind)));
  }

  static _registerRuntimes({ runtimes }) {
    ImageIpcHandlers._handle('getRuntimesView', IpcEnvelope.enveloped((_e, opts) => runtimes.view(opts)));
    ImageIpcHandlers._handle('checkRuntimeUpdates', IpcEnvelope.enveloped(() => runtimes.checkUpdates()));
    ImageIpcHandlers._handle('locateRuntime', IpcEnvelope.enveloped((event, runtimeId) => runtimes.locate(event, runtimeId)));
    ImageIpcHandlers._handle('registerRuntimeBinary', IpcEnvelope.enveloped((_e, runtimeId, binaryPath) => runtimes.register(runtimeId, binaryPath)));
    ImageIpcHandlers._handle('installRuntime', IpcEnvelope.enveloped((event, id) =>
      runtimes.install(id, SenderStream.create(event, ImageIpcHandlers.RUNTIME_EVENT_CHANNEL, { id }))));
    ImageIpcHandlers._handle('uninstallRuntime', IpcEnvelope.enveloped((_e, id) => runtimes.uninstall(id)));
  }

  static _registerDefaultsAndServers(service, { defaults, configs, slots }) {
    ImageIpcHandlers._handle('getDefaults', IpcEnvelope.raw(() => service.getDefaults()));
    ImageIpcHandlers._handle('isRoleReady', IpcEnvelope.raw((_e, role) => ImageIpcHandlers._isRoleReady(service, role)));
    ImageIpcHandlers._handle('getAutoUnloadMs', IpcEnvelope.enveloped(() => ({ ms: service.getAutoUnloadMs() })));
    ImageIpcHandlers._handle('setAutoUnloadMs', IpcEnvelope.enveloped((_e, ms) => ({ ms: service.setAutoUnloadMs(ms) })));
    ImageIpcHandlers._handle('setDefaults', IpcEnvelope.enveloped((_e, payload) => defaults.update(payload)));
    ImageIpcHandlers._handle('getRamPinStatus', IpcEnvelope.enveloped(() => ({ status: service.ramPin.getStatus() })));
    ImageIpcHandlers._handle('getServerConfigs', IpcEnvelope.enveloped(() => configs.view()));
    ImageIpcHandlers._handle('saveRemoteServers', IpcEnvelope.enveloped((_e, list) => ({ servers: service.saveRemoteServerConfigs(list || []) })));
    ImageIpcHandlers._handle('removeRemoteServer', IpcEnvelope.enveloped((_e, id) => ({ servers: service.removeRemoteServer(id) })));
    ImageIpcHandlers._handle('setRemoteServerModel', IpcEnvelope.enveloped((_e, id, modelId) => service.setRemoteServerModel(id, modelId || null)));
    ImageIpcHandlers._handle('setActiveServer', IpcEnvelope.enveloped((_e, role, id) => configs.setActive(role, id)));
    ImageIpcHandlers._handle('getServerStatus', IpcEnvelope.raw(() => slots.status()));
    ImageIpcHandlers._handle('startServer', IpcEnvelope.enveloped(() => service.startServerResolved()));
    ImageIpcHandlers._handle('stopServer', IpcEnvelope.enveloped(async () => ({ status: await slots.stopAll() })));
  }

  static _registerModels(slot, { models, installer, remover, updater }) {
    const events = (event) => SenderStream.create(event, ImageIpcHandlers.MODEL_EVENT_CHANNEL);
    ImageIpcHandlers._handle('modelCatalog', IpcEnvelope.enveloped(() => models.catalogView()));
    ImageIpcHandlers._handle('cancelModelDownload', IpcEnvelope.enveloped(() => { slot.cancel(); }));
    ImageIpcHandlers._handle('downloadModel', IpcEnvelope.enveloped((event, args) => installer.install(args, events(event))));
    ImageIpcHandlers._handle('removeInstalledModel', IpcEnvelope.enveloped((_e, id) => remover.remove(id)));
    ImageIpcHandlers._handle('updateModelFile', IpcEnvelope.enveloped((event, args) => updater.update(args, events(event))));
  }

  static _registerLoras({ loras, attacher }) {
    const events = (event) => SenderStream.create(event, ImageIpcHandlers.MODEL_EVENT_CHANNEL);
    ImageIpcHandlers._handle('listLoras', IpcEnvelope.enveloped(() => loras.list()));
    ImageIpcHandlers._handle('importLora', IpcEnvelope.enveloped((event, args) => loras.import(event, args)));
    ImageIpcHandlers._handle('loraCatalog', IpcEnvelope.enveloped(() => loras.catalogView()));
    ImageIpcHandlers._handle('downloadLora', IpcEnvelope.enveloped((event, args) => loras.download(args, events(event))));
    ImageIpcHandlers._handle('setModelLoras', IpcEnvelope.enveloped((_e, args) => attacher.attach(args)));
  }

  static _registerImports({ importer, adopter }) {
    const events = (event) => SenderStream.create(event, ImageIpcHandlers.MODEL_EVENT_CHANNEL);
    ImageIpcHandlers._handle('getPromptProfiles', IpcEnvelope.enveloped(() => ImageModelImporter.promptProfiles()));
    ImageIpcHandlers._handle('pickImportFile', IpcEnvelope.enveloped((event) => importer.pickFile(event)));
    ImageIpcHandlers._handle('importModelFromUrl', IpcEnvelope.enveloped((event, args) => importer.fromUrl(args, events(event))));
    ImageIpcHandlers._handle('importModelFromRepo', IpcEnvelope.enveloped((event, args) => importer.fromRepo(args, events(event))));
    ImageIpcHandlers._handle('importModelFromFile', IpcEnvelope.enveloped((event, args) => importer.fromFile(args, events(event))));
    ImageIpcHandlers._handle('scanExistingLibraries', IpcEnvelope.enveloped((_e, args) => adopter.scan(args)));
    ImageIpcHandlers._handle('pickLibraryDir', IpcEnvelope.enveloped((event) => ImageIpcHandlers._pickDir(event, {
      title: 'Choose a ComfyUI, Forge or Stable Diffusion WebUI folder',
      properties: ['openDirectory'],
    })));
    ImageIpcHandlers._handle('importExistingModel', IpcEnvelope.enveloped((_e, args) => adopter.adopt(args)));
  }

  static _registerGeneration({ generations }) {
    ImageIpcHandlers._handle('generate', IpcEnvelope.enveloped((event, args = {}) =>
      generations.generate(args, SenderStream.create(event, ImageIpcHandlers.IMAGE_EVENT_CHANNEL, { requestId: args.requestId }))));
    ImageIpcHandlers._handle('generateAbort', IpcEnvelope.enveloped(() => { generations.abort(); }));
  }

  static _handle(name, handler) {
    ipcMain.handle(`core.imageServer.${name}`, handler);
  }

  static async _pickDir(event, dialogOptions) {
    const picked = await PathPicker.pick(event, dialogOptions);
    return picked.canceled ? { canceled: true } : { canceled: false, dir: picked.paths[0] };
  }

  static _isRoleReady(service, role) {
    try {
      return !!service.isRoleReady(role);
    } catch (_) {
      return false;
    }
  }
}

module.exports = ImageIpcHandlers;
