const DesktopError = require('../DesktopError');
const RefLocator = require('./RefLocator');
const UiaObservation = require('./UiaObservation');

class DesktopClickLadder {
  constructor(parts) {
    this._parts = parts;
  }

  async click(w, args) {
    const opts = DesktopClickLadder._options(args);
    const refusal = this._parts.guards.targetRefusal(w);
    if (refusal) return DesktopError.toResult(refusal);
    const first = await this._attempt(() => this._dispatch(w, args, opts));
    if (first.success || !DesktopClickLadder._fallsBackToVision(args, first)) return first;
    const seen = await this._attempt(() => this._byDescription(w, args, opts));
    return seen.success ? { ...seen, data: { ...seen.data, refFailed: first.error } } : seen;
  }

  async _attempt(fn) {
    try {
      return await fn();
    } catch (e) {
      return DesktopError.toResult(e);
    }
  }

  static _fallsBackToVision(args, result) {
    return args.ref != null && !!args.description && !result.code;
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
    const found = await this._parts.vision.locate(w, args.description, { zoom: args.zoom === true });
    if (found.result) return found.result;
    const { sx, sy } = found.point;
    const hit = await this._parts.pointer.click(w, sx, sy, opts);
    return {
      success: true,
      data: { method: 'vision+pointer', screen: DesktopClickLadder._rounded(sx, sy), ms: found.ms, ...(hit ? { hit } : {}) },
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
