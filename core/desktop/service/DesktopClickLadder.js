const DesktopError = require('../DesktopError');
const RefLocator = require('./RefLocator');
const ScreenshotImage = require('./ScreenshotImage');
const UiaObservation = require('./UiaObservation');

class DesktopClickLadder {
  constructor(parts) {
    this._parts = parts;
  }

  async click(w, args) {
    const opts = DesktopClickLadder._options(args);
    const refusal = this._parts.guards.targetRefusal(w);
    if (refusal) return DesktopError.toResult(refusal);
    try {
      return await this._dispatch(w, args, opts);
    } catch (e) {
      return DesktopError.toResult(e);
    }
  }

  _dispatch(w, args, opts) {
    if (args.ref != null) return this._byRef(w, args, opts);
    if (args.x != null && args.y != null) return this._byPoint(w, args, opts);
    if (args.description) return this._byDescription(w, args, opts);
    return { success: false, error: 'Pass ref (from desktop_observe), x/y (from desktop_screenshot), or description.' };
  }

  async _byRef(w, args, opts) {
    const ref = Number(args.ref);
    if (!this._parts.observation.isFor(w.hwnd)) return { success: false, error: UiaObservation.NOT_OBSERVED };
    const located = DesktopClickLadder._isPlainClick(opts)
      ? await this._invokeOrLocate(ref)
      : await this._locateObserved(w, ref, args.ref);
    if (located.result) return located.result;
    const { rect, scrolled } = located;
    const hit = await this._parts.pointer.click(w, rect[0] + rect[2] / 2, rect[1] + rect[3] / 2, { ...opts, ref, refRect: rect });
    return { success: true, data: { method: 'pointer', ref, ...(scrolled ? { scrolled: true } : {}), ...(hit ? { hit } : {}) } };
  }

  async _invokeOrLocate(ref) {
    const r = await this._parts.uia().act(ref, 'click');
    if (r.done) return { result: { success: true, data: { method: `uia:${r.done}`, ref } } };
    if (!Array.isArray(r.rect)) return { result: { success: false, error: RefLocator.offscreenMessage(ref) } };
    return { rect: r.rect, scrolled: !!r.scrolled };
  }

  async _locateObserved(w, ref, rawRef) {
    const node = this._parts.observation.node(w.hwnd, ref);
    if (!node) return { result: { success: false, error: `ref ${rawRef} is not in the last observation; observe again.` } };
    return this._parts.locator.rectOf(ref, node);
  }

  async _byPoint(w, args, opts) {
    const { sx, sy } = this._parts.frames.toScreen(w, args.x, args.y);
    const hit = await this._parts.pointer.click(w, sx, sy, opts);
    return { success: true, data: { method: 'pointer', screen: DesktopClickLadder._rounded(sx, sy), ...(hit ? { hit } : {}) } };
  }

  async _byDescription(w, args, opts) {
    const { nativeImage, visualGrounding } = this._parts;
    if (!visualGrounding) return { success: false, error: 'Visual grounding is not available.' };
    const { rect, shot } = this._parts.capture(w);
    const png = ScreenshotImage.fullSize(nativeImage, shot).toPNG();
    const found = await visualGrounding.locateInImage(nativeImage.createFromBuffer(png), args.description,
      { zoom: args.zoom === true, what: `the "${w.title}" window`, skipVisionCheck: false });
    if (!found.success) return found;
    const sx = rect.x + found.data.point.x * (rect.width / shot.width);
    const sy = rect.y + found.data.point.y * (rect.height / shot.height);
    const hit = await this._parts.pointer.click(w, sx, sy, opts);
    return {
      success: true,
      data: { method: 'vision+pointer', screen: DesktopClickLadder._rounded(sx, sy), profile: found.data.profile, ms: found.data.ms, ...(hit ? { hit } : {}) },
    };
  }

  static _options(args) {
    return { button: args.button || 'left', double: args.double === true || Number(args.clickCount) === 2 };
  }

  static _isPlainClick(opts) {
    return opts.button === 'left' && !opts.double;
  }

  static _rounded(sx, sy) {
    return { x: Math.round(sx), y: Math.round(sy) };
  }
}

module.exports = DesktopClickLadder;
