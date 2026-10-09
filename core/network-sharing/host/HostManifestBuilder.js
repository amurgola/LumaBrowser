const HostDialPosition = require('./HostDialPosition');

class HostManifestBuilder {
  static PROTO = 1;

  constructor({ host, inventory, llmServerService, imageServerService }) {
    this._host = host;
    this._inventory = inventory;
    this._llm = llmServerService || null;
    this._image = imageServerService || null;
  }

  async execute() {
    this._setupSharedVariables();
    await this._resolveLlms();
    await this._resolveGpus();
    await this._resolveImageSlots();
    this._resolveThinking();
    return this._manifest;
  }

  _setupSharedVariables() {
    this._flags = this._host.getShareFlags();
    this._manifest = {
      instance: { name: this._host.getInstanceName(), id: this._host.instanceId, proto: HostManifestBuilder.PROTO, version: this._host.getAppVersion() },
      llms: [],
      image: { generate: { available: false }, edit: { available: false } },
    };
  }

  async _resolveLlms() {
    try {
      const models = this._listChatModels();
      const contextWindow = this._inventory.localContextWindow();
      const expanded = await this._addInstalledLocalModels(models, contextWindow);
      for (const model of models) this._addListedModel(model, expanded, contextWindow);
    } catch (err) {
      console.warn('[sharing] manifest LLM build failed:', err && err.message);
    }
  }

  _listChatModels() {
    const chatRouter = this._host.getChatRouter();
    const listing = chatRouter && chatRouter.listModels ? chatRouter.listModels() : { models: [] };
    return listing.models || [];
  }

  async _addInstalledLocalModels(models, contextWindow) {
    if (!this._flags.shareLocalLlm || !models.some((model) => model && model.isLocal)) return false;
    const locals = await this._inventory.localLlmModels();
    if (!locals || locals.length === 0) return false;
    for (const local of locals) {
      this._manifest.llms.push({ ref: `local::${local.stem}`, label: `Local · ${local.display || local.stem}`, kind: 'local', current: !!local.current, contextWindow });
    }
    return true;
  }

  _addListedModel(model, localExpanded, contextWindow) {
    if (model.isLocal) {
      if (!this._flags.shareLocalLlm || localExpanded) return;
      this._manifest.llms.push({ ref: model.ref, label: model.label, kind: 'local', current: true, readOnly: true, contextWindow });
      return;
    }
    if (!this._flags.shareRemoteLlms) return;
    if (typeof model.ref === 'string' && model.ref.startsWith('peer:')) return;
    this._manifest.llms.push({ ref: model.ref, label: model.label, kind: 'remote', providerType: model.providerType });
  }

  async _resolveGpus() {
    try {
      const lending = this._host.getRpcLending();
      if (!this._flags.shareGpus || !lending) return;
      const share = await lending.describeShare();
      if (share.available) this._manifest.gpus = { available: true, busy: !!share.busy, devices: share.devices };
    } catch (err) {
      console.warn('[sharing] manifest GPU build failed:', err && err.message);
    }
  }

  async _resolveImageSlots() {
    try {
      if (!this._image) return;
      if (this._flags.shareImageGen) this._manifest.image.generate = await this._imageSlot('image-generate', 'generate');
      if (this._flags.shareImageEdit) this._manifest.image.edit = await this._imageSlot('image-edit', 'edit');
    } catch (err) {
      console.warn('[sharing] manifest image build failed:', err && err.message);
    }
  }

  async _imageSlot(role, kind) {
    const entry = this._image.computeLocalServerEntry(role);
    return {
      available: !!(entry && entry.available),
      modelId: (entry && entry.selectedModelId) || null,
      modelLabel: (entry && entry.selectedModelLabel) || null,
      endpoint: `/sharing/image/${kind}`,
      models: (await this._inventory.imageModels(kind)) || [],
    };
  }

  _resolveThinking() {
    try {
      const caps = this._runtimeCaps();
      this._manifest.thinking = {
        available: !!(caps && caps.reasoningEffort),
        positions: (caps && caps.reasoningDial) || null,
        hostDefault: HostDialPosition.of(this._llm) || 'default',
      };
    } catch (_) {
      this._manifest.thinking = { available: false, positions: null, hostDefault: 'default' };
    }
  }

  _runtimeCaps() {
    const runtime = this._llm && this._llm.runtimeServer;
    return runtime && runtime.getStatus ? (runtime.getStatus().caps || null) : null;
  }
}

module.exports = HostManifestBuilder;
