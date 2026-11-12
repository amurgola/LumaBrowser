const EditProfiles = require('../prompt/EditProfiles');
const FlowSchedule = require('../FlowSchedule');
const RefImagePresizer = require('../RefImagePresizer');
const RefSizePlanner = require('../RefSizePlanner');
const ImageDimensions = require('../../shared/content/ImageDimensions');
const EditRenderScale = require('./EditRenderScale');
const ImageCanvas = require('./ImageCanvas');
const ImageFamilyScaffold = require('./ImageFamilyScaffold');
const ImageLoraSpecs = require('./ImageLoraSpecs');
const ImageModelInfo = require('./ImageModelInfo');

class ImageRequestPlanner {
  static DEFAULTS = { width: 512, height: 512, steps: 20, cfgScale: 7.0, sampler: 'euler' };

  static DEFAULT_STRENGTH = 0.75;

  static PRESIZED_REF_ARGS = 'resize_before_vae=false';

  constructor({
    lorasDir = null, presize = RefImagePresizer.presize, measure = ImageRequestPlanner.measureRef, resize = RefImagePresizer.nativeResize,
  } = {}) {
    this._lorasDir = lorasDir;
    this._presize = presize;
    this._measure = measure;
    this._scaleImage = resize;
  }

  static measureRef(ref) {
    try {
      const buf = RefImagePresizer.toBuffer(ref);
      return buf ? ImageDimensions.read(buf) : null;
    } catch (_) {
      return null;
    }
  }

  plan({ request, model, send = () => {} }) {
    this._setup(request, model, send);
    this._resolveDefaults();
    this._snapToNative();
    this._alignToGrid();
    this._raiseToRenderFloor();
    this._enlargeEditRender();
    this._moveOffHarshCanvas();
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
      outputSize: plan.outputSize ? `${plan.outputSize.width}x${plan.outputSize.height}` : undefined,
    };
  }

  _setup(request, model, send) {
    this._request = request;
    this._model = model;
    this._send = send;
    this._md = ImageFamilyScaffold.merge(model);
    this._refCount = Array.isArray(request.refImages) ? request.refImages.filter(Boolean).length : 0;
    this._customSigmas = null;
    this._outputSize = null;
    this._init = { initImage: request.initImage || null, mask: request.mask || null };
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

  _raiseToRenderFloor() {
    if (this._request.initImage || this._request.mask) return;
    const e = this._effective;
    const asked = { width: e.width, height: e.height };
    const size = ImageCanvas.raiseToMinArea(e.width, e.height, this._model.constraints);
    if (!size) return;
    this._resize('render-floor', size);
    this._outputSize = asked;
  }

  _enlargeEditRender() {
    const profile = this._refCount ? EditProfiles.editProfileFor(this._model.family) : null;
    if (!profile || !(profile.renderScale > 1) || this._request.initImage || this._request.mask) return;
    const e = this._effective;
    const canvas = { width: e.width, height: e.height };
    const size = EditRenderScale.plan({
      canvas,
      source: this._measure((this._request.refImages || []).filter(Boolean)[0]),
      scale: profile.renderScale,
      minPixels: profile.renderMinPixels,
      maxPixels: profile.renderMaxPixels,
      grid: ImageModelInfo.gridOf(this._model, RefSizePlanner.DEFAULT_GRID),
    });
    if (!size) return;
    this._resize('edit-render-enlarged', size);
    this._outputSize = this._outputSize || canvas;
  }

  _moveOffHarshCanvas() {
    const profile = this._refCount && this._init.initImage ? EditProfiles.editProfileFor(this._model.family) : null;
    const band = profile && profile.harshSides;
    const e = this._effective;
    const inBand = (side) => band && side > band.above && side < band.below;
    if (!inBand(e.width) || !inBand(e.height)) return;
    const asked = { width: e.width, height: e.height };
    const grid = ImageModelInfo.gridOf(this._model, RefSizePlanner.DEFAULT_GRID);
    const size = ImageCanvas.raiseToMinArea(e.width, e.height, { minRenderPixels: profile.renderMinPixels, dimensionMultiple: grid });
    const moved = size && this._resizeInit(size);
    if (!moved) return;
    this._init = moved;
    this._resize('edit-canvas-moved', size);
    this._outputSize = asked;
  }

  _resizeInit(size) {
    try {
      const scale = (value) => {
        const buf = value ? RefImagePresizer.toBuffer(value) : null;
        return buf ? this._scaleImage(buf, size.width, size.height) : null;
      };
      const initImage = scale(this._init.initImage);
      const mask = this._init.mask ? scale(this._init.mask) : null;
      return initImage && (mask || !this._init.mask) ? { initImage, mask } : null;
    } catch (_) {
      return null;
    }
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
    const md = this._md;
    const nodes = Array.isArray(own) ? own : (Array.isArray(md.sigmaNodes) ? md.sigmaNodes : null);
    const fixed = !nodes && Array.isArray(md.fixedSigmas) ? md.fixedSigmas : null;
    const list = nodes || fixed;
    if (!list || !list.length) return;
    const steps = this._request.steps;
    if (!(Array.isArray(own) || !steps || steps === list.length)) return;
    const e = this._effective;
    this._customSigmas = fixed
      ? FlowSchedule.fixedSigmas(fixed)
      : FlowSchedule.sigmasFromNodes({ nodes, family: this._model.family, width: e.width, height: e.height });
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
        refImageArgs: this._refImageArgs(),
        refMaxPixels: this._refMaxPixels(),
        cacheMode: r.cacheMode || md.cacheMode || null,
        cacheOption: r.cacheOption || md.cacheOption || null,
        initImage: this._init.initImage,
        strength: ImageRequestPlanner._strength(r.initImage, r.strength),
        refImages: this._refs.refImages,
        mask: this._init.mask,
      },
      refCount: this._refCount,
      refSizes: this._refs.refSizes,
      outputSize: this._outputSize,
    };
  }

  _refImageArgs() {
    const own = this._refCount ? (this._request.refImageArgs || this._md.refImageArgs || null) : null;
    const parts = [own, this._refs.refImageArgs].filter(Boolean).map(String);
    return parts.length ? parts.join(',') : null;
  }

  _refMaxPixels() {
    const profile = this._refCount ? EditProfiles.editProfileFor(this._model.family) : null;
    return (profile && ImageRequestPlanner._positive(profile.refMaxPixels)) || null;
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
