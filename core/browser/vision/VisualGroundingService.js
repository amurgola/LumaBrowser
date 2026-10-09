const GroundingClient = require('./GroundingClient');
const GroundingProfiles = require('./GroundingProfiles');
const GroundingCacheBridge = require('./GroundingCacheBridge');
const ImageOps = require('./ImageOps');
const CoordinateSpace = require('./CoordinateSpace');
const ResponseText = require('../../llm-service/ResponseText');

class VisualGroundingService {
  static SLOT_ID = 'visual-grounding';
  static PROFILE_SETTING = 'core.vision.groundingProfile';
  static SLOT_LABEL = 'Visual grounding (vision model that finds elements on screenshots)';
  static COMPLETION_TIMEOUT_MS = 120000;
  static PAGE_SUBJECT = 'the visible part of the page. Scroll or describe it differently';
  static NO_PROVIDER_TAB = 'No model is configured for visual grounding. Set one for the "Visual grounding" slot (a vision model).';
  static NO_PROVIDER_IMAGE = 'No model is configured for visual grounding. Set one up in the LLM tab (Visual grounding).';

  constructor({ llmService, tabManager, db = null, nativeImage, resolutionCache = null }) {
    this.llmService = llmService;
    this.tabManager = tabManager;
    this.db = db;
    this.resolutionCache = resolutionCache;
    this.imageOps = new ImageOps(nativeImage);
    this._cache = new GroundingCacheBridge(resolutionCache, tabManager);
    this._registerSlot();
  }

  isAvailable() {
    const config = this.llmService && this.llmService.getSlotConfig(VisualGroundingService.SLOT_ID);
    return !!(config && config.provider);
  }

  profile() {
    const override = this.db ? this.db.get(VisualGroundingService.PROFILE_SETTING, null) : null;
    if (override) return GroundingProfiles.getProfile(override);
    const described = this.llmService.describeSlot ? this.llmService.describeSlot(VisualGroundingService.SLOT_ID) : { model: null };
    return GroundingProfiles.profileForModel(described.model || '');
  }

  async locate(tabId, { description, zoom = false, noCache = false } = {}) {
    const desc = VisualGroundingService._clean(description);
    if (!desc) return VisualGroundingService._noDescription();
    const cached = noCache ? null : await this._serveCached(tabId, desc);
    if (cached) return cached;
    const refusal = await this._visionRefusal(VisualGroundingService.NO_PROVIDER_TAB);
    if (refusal) return refusal;
    return this._locateOnScreenshot(tabId, desc, zoom);
  }

  async locateInImage(image, description, { zoom = false, what = 'the screenshot', skipVisionCheck = true } = {}) {
    const desc = VisualGroundingService._clean(description);
    if (!desc) return VisualGroundingService._noDescription();
    const refusal = skipVisionCheck ? null : await this._visionRefusal(VisualGroundingService.NO_PROVIDER_IMAGE);
    if (refusal) return refusal;
    const profile = this.profile();
    const result = await this._client(profile).locate({ image, instruction: desc, zoom });
    if (!result.ok) return VisualGroundingService._groundingFailure(result, desc, what);
    return { success: true, data: { point: result.point, bbox: result.bbox, profile: profile.id, refined: result.refined, ms: result.ms } };
  }

  async clickDescribed(tabId, options = {}) {
    const desc = VisualGroundingService._clean(options.description);
    const cachedClick = desc ? await this._clickCached(tabId, desc, options) : null;
    if (cachedClick) return cachedClick;
    return this._clickLocated(tabId, options);
  }

  _registerSlot() {
    if (!this.llmService || typeof this.llmService.registerSlot !== 'function') return;
    this.llmService.registerSlot(VisualGroundingService.SLOT_ID, {
      extensionId: 'core', label: VisualGroundingService.SLOT_LABEL, required: false,
    });
  }

  static _clean(description) {
    return String(description || '').trim();
  }

  static _noDescription() {
    return { success: false, error: 'description is required' };
  }

  async _serveCached(tabId, desc) {
    const hit = await this._cache.replay(tabId, desc);
    if (!hit) return null;
    this._cache.noteHit(hit);
    return { success: true, data: GroundingCacheBridge.dataFor(hit) };
  }

  async _visionRefusal(noProviderMessage) {
    if (!this.isAvailable()) return { success: false, code: 'NO_PROVIDER', error: noProviderMessage };
    const vision = await this.llmService.ensureSlotVision(VisualGroundingService.SLOT_ID);
    return vision.ok ? null : { success: false, code: vision.code, error: vision.error };
  }

  async _locateOnScreenshot(tabId, desc, zoom) {
    const shot = await this.tabManager.screenshotTab(tabId, { cssScale: true });
    if (!shot.success) return { success: false, error: shot.error || 'screenshot failed' };
    const image = this.imageOps.fromPngBase64(shot.data.screenshot);
    const found = await this.locateInImage(image, desc, { zoom, what: VisualGroundingService.PAGE_SUBJECT });
    if (!found.success) return found;
    const { x, y, bbox } = VisualGroundingService._toViewport(found.data, shot.data.frame);
    const pointed = await this.tabManager.pointInfo(tabId, x, y);
    await this._cache.remember(tabId, desc, x, y);
    return {
      success: true,
      data: { x, y, bbox, target: pointed.success ? pointed.data.target || null : null, profile: found.data.profile, refined: found.data.refined, ms: found.data.ms },
    };
  }

  static _toViewport({ point, bbox }, frame) {
    const css = (p) => CoordinateSpace.imageToCss(p, frame);
    const at = css(point);
    const result = { x: Math.round(at.x), y: Math.round(at.y), bbox: undefined };
    if (bbox) {
      const a = css({ x: bbox[0], y: bbox[1] });
      const b = css({ x: bbox[2], y: bbox[3] });
      result.bbox = [Math.round(a.x), Math.round(a.y), Math.round(b.x), Math.round(b.y)];
    }
    return result;
  }

  _client(profile) {
    return new GroundingClient({ complete: (messages, body) => this._complete(messages, body), imageOps: this.imageOps, profile });
  }

  async _complete(messages, body) {
    const res = await this.llmService.sendCompletion(VisualGroundingService.SLOT_ID, messages, {
      ...body, needsVision: true, timeout: VisualGroundingService.COMPLETION_TIMEOUT_MS, label: 'Visual grounding',
    });
    if (!res || !res.success) throw new Error((res && res.error) || 'grounding request failed');
    return ResponseText.extract(res.response) || '';
  }

  static _groundingFailure(result, desc, what) {
    return {
      success: false,
      code: result.infeasible ? 'NOT_FOUND' : 'GROUNDING_FAILED',
      error: result.infeasible ? `The vision model could not find "${desc}" on ${what}.` : `Visual grounding failed: ${result.error}`,
    };
  }

  async _clickCached(tabId, desc, options) {
    const hit = await this._cache.replay(tabId, desc);
    if (!hit) return null;
    const plain = (!options.button || options.button === 'left') && Number(options.clickCount || 1) === 1;
    const click = plain && hit.exact
      ? await this.tabManager.clickElement(tabId, { selector: hit.selector })
      : await this.tabManager.clickAt(tabId, { x: hit.x, y: hit.y, button: options.button, clickCount: options.clickCount });
    if (!click || !click.success) {
      this._cache.noteFailedClick(hit, click);
      return null;
    }
    this._cache.noteHit(hit);
    return { ...click, data: { x: hit.x, y: hit.y, ...click.data, located: GroundingCacheBridge.dataFor(hit), resolvedBy: 'cache' } };
  }

  async _clickLocated(tabId, options) {
    const located = await this.locate(tabId, { ...options, noCache: true });
    if (!located.success) return located;
    const click = await this.tabManager.clickAt(tabId, {
      x: located.data.x, y: located.data.y, button: options.button, clickCount: options.clickCount,
    });
    if (!click.success) return click;
    return { ...click, data: { ...click.data, located: located.data, resolvedBy: 'vision' } };
  }
}

module.exports = VisualGroundingService;
