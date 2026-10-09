const PlacementLayout = require('../../shared/runtime/PlacementLayout');
const PlacementStore = require('../../shared/runtime/placement/PlacementStore');

class PlacementLifecycle {
  static UNMEASURED_ERROR =
    'Run a test render first: placed models need a measured VRAM/RAM footprint before allocation.';

  constructor({ servers, settingsDb, gate, prewarmer, getLauncher }) {
    this._servers = servers;
    this._settingsDb = settingsDb;
    this._gate = gate;
    this._prewarmer = prewarmer;
    this._getLauncher = getLauncher;
  }

  async startAll() {
    const layout = PlacementStore.load(this._settingsDb);
    if (!this._gate.canApply(layout)) return { success: false, error: PlacementLifecycle.UNMEASURED_ERROR };
    if (PlacementLayout.hotswapPools(layout).length) return this._startForSingularity();
    return this._startEverySlot();
  }

  async stopAll() {
    const { llm, image, music, grounding } = this._servers;
    await PlacementLifecycle._quietly(() => llm && llm.runtimeServer && llm.runtimeServer.stop());
    await PlacementLifecycle._quietly(() => image && image.shutdown && image.shutdown());
    await PlacementLifecycle._quietly(() => music && music.stopServer && music.stopServer());
    await PlacementLifecycle._quietly(() => grounding && grounding.stop());
    return { success: true };
  }

  async _startForSingularity() {
    const results = PlacementLifecycle._emptyResults();
    this._prewarmer.prewarmInBackground();
    results.llm = await this._startLlm();
    return { success: true, results, hotswap: true };
  }

  async _startEverySlot() {
    const results = PlacementLifecycle._emptyResults();
    results.llm = await this._startLlm();
    const defaults = this._servers.imageDefaults();
    results.generate = await this._startImage(defaults.modelId || undefined, 'image-generate');
    if (defaults.editModelId) results.edit = await this._startImage(defaults.editModelId, 'image-edit');
    if (defaults.videoModelId) results.video = await this._startImage(defaults.videoModelId, 'image-video');
    return { success: true, results };
  }

  _startLlm() {
    return PlacementLifecycle._attempt(() => this._getLauncher().resolveAndStart(this._servers.llm));
  }

  _startImage(modelId, role) {
    return PlacementLifecycle._attempt(() => this._servers.image.startServerResolved(modelId, { role }));
  }

  static _emptyResults() {
    return { llm: null, generate: null, edit: null, video: null };
  }

  static async _attempt(fn) {
    try { return await fn(); } catch (e) { return { success: false, error: e && e.message }; }
  }

  static async _quietly(fn) {
    try { await fn(); } catch (_) {}
  }
}

module.exports = PlacementLifecycle;
