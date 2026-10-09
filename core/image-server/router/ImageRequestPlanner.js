const EditProfiles = require('../prompt/EditProfiles');
const FlowSchedule = require('../FlowSchedule');
const RefImagePresizer = require('../RefImagePresizer');
const RefSizePlanner = require('../RefSizePlanner');
const ImageCanvas = require('./ImageCanvas');
const ImageFamilyScaffold = require('./ImageFamilyScaffold');
const ImageLoraSpecs = require('./ImageLoraSpecs');
const ImageModelInfo = require('./ImageModelInfo');

class ImageRequestPlanner {
  static DEFAULTS = { width: 512, height: 512, steps: 20, cfgScale: 7.0, sampler: 'euler' };

  static DEFAULT_STRENGTH = 0.75;

  static PRESIZED_REF_ARGS = 'resize_before_vae=false';

  constructor({ lorasDir = null, presize = RefImagePresizer.presize } = {}) {
    this._lorasDir = lorasDir;
    this._presize = presize;
  }

  plan({ request, model, send = () => {} }) {
    this._setup(request, model, send);
    this._resolveDefaults();
    this._snapToNative();
    this._alignToGrid();
    this._applyEditProfile();
    this._resolveSigmas();
    this._presizeRefs();
    return this._createPlan();
  }

  static metaFields(plan) {
    const p = plan.params;
    return {
      width: p.width,
      height: p.height,
      steps: p.steps,
      cfgScale: p.cfgScale,
      sampler: p.sampler,
      scheduler: p.scheduler,
      seed: p.seed,
      strength: p.strength,
      sigmas: p.customSigmas || undefined,
      loras: p.loras ? p.loras.map((l) => `${l.path}@${l.multiplier}`) : undefined,
      refSizes: plan.refSizes ? plan.refSizes.map((r) => `${r.width}x${r.height}`) : undefined,
    };
  }

  _setup(request, model, send) {
    this._request = request;
    this._model = model;
    this._send = send;
    this._md = ImageFamilyScaffold.merge(model);
    this._refCount = Array.isArray(request.refImages) ? request.refImages.filter(Boolean).length : 0;
    this._customSigmas = null;
    this._refs = { refImages: request.refImages || null, refImageArgs: null, refSizes: null };
  }

  _resolveDefaults() {
    const r = this._request;
    const md = this._md;
    const d = ImageRequestPlanner.DEFAULTS;
    this._effective = {
      prompt: ImageFamilyScaffold.buildPrompt(r.prompt, md),
      negativePrompt: r.negativePrompt || md.negativePrompt || null,
      width: r.width || md.width || d.width,
      height: r.height || md.height || d.height,
      steps: r.steps || md.steps || d.steps,
      cfgScale: ImageRequestPlanner._firstNumber(r.cfgScale, md.cfgScale, d.cfgScale),
      sampler: r.sampler || md.sampler || d.sampler,
      scheduler: r.scheduler || md.scheduler || undefined,
      seed: typeof r.seed === 'number' ? r.seed : null,
    };
  }

  _snapToNative() {
    if (this._model.family !== 'qwen-image-edit' || this._request.snapNative === false) return;
    this._resize('native-resolution', ImageCanvas.snapToQwenNative(this._effective.width, this._effective.height));
  }

  _alignToGrid() {
    this._resize('grid-aligned', ImageCanvas.alignToGrid(this._effective.width, this._effective.height, this._model.constraints));
  }

  _resize(phase, size) {
    if (!size) return;
    const e = this._effective;
    this._send('status', { phase, from: `${e.width}x${e.height}`, to: `${size.width}x${size.height}` });
    e.width = size.width;
    e.height = size.height;
  }

  _applyEditProfile() {
    if (!this._refCount) return;
    this._effective.prompt = EditProfiles.applyEditProfile(this._effective.prompt, { family: this._model.family, refCount: this._refCount });
  }

  _resolveSigmas() {
    const own = this._request.sigmaNodes;
    const nodes = Array.isArray(own) ? own : (Array.isArray(this._md.sigmaNodes) ? this._md.sigmaNodes : null);
    if (!nodes || !nodes.length) return;
    const steps = this._request.steps;
    if (!(Array.isArray(own) || !steps || steps === nodes.length)) return;
    const e = this._effective;
    this._customSigmas = FlowSchedule.sigmasFromNodes({ nodes, family: this._model.family, width: e.width, height: e.height });
    if (this._customSigmas) e.steps = this._customSigmas.length - 1;
  }

  _presizeRefs() {
    const profile = EditProfiles.editProfileFor(this._model.family);
    if (!this._refCount || !profile || !profile.presizeRefs) return;
    const sized = this._presize({
      refImages: this._request.refImages,
      canvas: { width: this._effective.width, height: this._effective.height },
      refArea: ImageRequestPlanner._positive(this._request.refArea) || ImageRequestPlanner._positive(this._md.refArea) || profile.refArea,
      grid: ImageModelInfo.gridOf(this._model, RefSizePlanner.DEFAULT_GRID),
    });
    if (!sized.sized) return;
    this._refs = { refImages: sized.refImages, refImageArgs: ImageRequestPlanner.PRESIZED_REF_ARGS, refSizes: sized.sizes };
  }

  _createPlan() {
    const r = this._request;
    const md = this._md;
    return {
      params: {
        ...this._effective,
        loras: ImageLoraSpecs.resolve(Array.isArray(r.loras) ? { loras: r.loras } : md, this._lorasDir),
        customSigmas: this._customSigmas,
        refImageArgs: this._refs.refImageArgs,
        cacheMode: r.cacheMode || md.cacheMode || null,
        cacheOption: r.cacheOption || md.cacheOption || null,
        initImage: r.initImage || null,
        strength: ImageRequestPlanner._strength(r.initImage, r.strength),
        refImages: this._refs.refImages,
        mask: r.mask || null,
      },
      refCount: this._refCount,
      refSizes: this._refs.refSizes,
    };
  }

  static _strength(initImage, strength) {
    if (initImage == null) return undefined;
    const value = typeof strength === 'number' && Number.isFinite(strength) ? strength : ImageRequestPlanner.DEFAULT_STRENGTH;
    return Math.max(0, Math.min(1, value));
  }

  static _firstNumber(...values) {
    return values.find((v) => typeof v === 'number');
  }

  static _positive(value) {
    return Number(value) > 0 ? Number(value) : null;
  }
}

module.exports = ImageRequestPlanner;
