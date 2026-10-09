const ContextSurface = require('./ContextSurface');
const ExtensionUrls = require('./ExtensionUrls');
const ExtensionGlobals = require('./ExtensionGlobals');
const ExtensionWiring = require('./ExtensionWiring');
const ManifestFields = require('./ManifestFields');
const ChatImageGenerator = require('./ChatImageGenerator');
const ImageVramMediator = require('./ImageVramMediator');
const ImageSlotWarmer = require('./ImageSlotWarmer');
const VisionAvailability = require('./VisionAvailability');
const ChatModeRegistry = require('../../llm-server/chat/ChatModeRegistry');
const LabHarness = require('../../roleplay-lab/LabHarness');

class ChatSurface extends ContextSurface {
  static ROLE_GENERATE = 'image-generate';

  constructor({
    registry = ChatModeRegistry.shared,
    images = new ChatImageGenerator(),
    vram = ImageVramMediator.shared,
    warmer = new ImageSlotWarmer(),
    imageRouter = ExtensionGlobals.imageRouter,
    imageService = ExtensionGlobals.imageServerService,
    llmService = ExtensionGlobals.llmServerService,
    chatRouter = ExtensionGlobals.chatRouter,
    lab = LabHarness.current,
  } = {}) {
    super();
    this._registry = registry;
    this._images = images;
    this._vram = vram;
    this._warmer = warmer;
    this._imageRouter = imageRouter;
    this._imageService = imageService;
    this._llmService = llmService;
    this._chatRouter = chatRouter;
    this._lab = lab;
  }

  get key() {
    return 'chat';
  }

  forExtension(extensionId, manifest = null) {
    return {
      registerMode: (descriptor) => this._registry.register(ChatSurface._flagModule(descriptor, extensionId, manifest), extensionId),
      unregisterMode: (modeId) => this._registry.unregister(modeId),
      listModes: () => this._registry.list(),
      uiUrl: (relPath) => ExtensionUrls.uiAsset(extensionId, relPath),
      generateImage: (opts = {}) => this._images.generate(opts),
      abortImage: () => this._images.abort(),
      complete: (opts = {}) => this._complete(opts),
      visionAvailable: (modelRef = null) => VisionAvailability.check(modelRef, this._llmService()),
      beginExclusiveImage: () => this._vram.begin(),
      endExclusiveImage: () => this._vram.end(),
      isImageReady: () => this._isImageReady(),
      imageNativeSize: (modelRef = null) => this._imageNativeSize(modelRef),
      warmImageSlot: (slot, modelRef = null) => this._warmer.warm(slot, modelRef),
    };
  }

  static _flagModule(descriptor, extensionId, manifest) {
    const file = manifest && ManifestFields.file(manifest.chatUi);
    if (descriptor && file && descriptor.chatUiUrl === ExtensionUrls.uiAsset(extensionId, file)) {
      descriptor.chatUiModule = ExtensionWiring.isModuleBundle(manifest);
    }
    return descriptor;
  }

  async _complete(opts) {
    const mocked = this._labCompletion(opts);
    if (mocked != null) return mocked;
    const router = this._chatRouter();
    if (!router || typeof router.complete !== 'function') return { error: 'chat completion unavailable' };
    try {
      return await router.complete(opts);
    } catch (e) {
      return { error: (e && e.message) || 'complete failed' };
    }
  }

  _labCompletion(opts) {
    const lab = this._lab();
    if (!lab || !lab.active || typeof lab.completeMock !== 'function') return null;
    try { return lab.completeMock(opts); } catch (_) { return null; }
  }

  _isImageReady() {
    try {
      const svc = this._imageService();
      if (!svc) return false;
      if (typeof svc.isRoleReady === 'function') return svc.isRoleReady(ChatSurface.ROLE_GENERATE);
      if (typeof svc.isEnabled !== 'function' || !svc.isEnabled()) return false;
      const defaults = typeof svc.getDefaults === 'function' ? svc.getDefaults() : null;
      return !!(defaults && defaults.runtimeId && defaults.modelId);
    } catch (_) {
      return false;
    }
  }

  async _imageNativeSize(modelRef) {
    try {
      const router = this._imageRouter();
      if (!router || typeof router.getModelNativeSize !== 'function') return null;
      return await router.getModelNativeSize(modelRef);
    } catch (_) {
      return null;
    }
  }
}

module.exports = ChatSurface;
