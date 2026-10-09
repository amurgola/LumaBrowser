const UiaObservation = require('./UiaObservation');

class RefLocator {
  static offscreenMessage(ref) {
    return `ref ${ref} is offscreen and could not be scrolled into view; scroll the window and observe again.`;
  }

  constructor({ uia, observation, frames }) {
    this._uia = uia;
    this._observation = observation;
    this._frames = frames;
  }

  async rectOf(ref, node) {
    const loc = await this._uia().act(ref, 'locate').catch(() => null);
    if (loc && Array.isArray(loc.rect)) return { rect: loc.rect, scrolled: !!loc.scrolled };
    if (loc && Object.prototype.hasOwnProperty.call(loc, 'rect') && loc.rect == null) throw new Error(RefLocator.offscreenMessage(ref));
    return { rect: node.rect, scrolled: false };
  }

  async pointOf(w, p, label) {
    if (!p || typeof p !== 'object') throw new Error(`${label} is required: { ref } from desktop_observe or { x, y } from desktop_screenshot.`);
    if (p.ref != null) return this._refCenter(w, p, label);
    if (p.x != null && p.y != null) return this._frames.toScreen(w, p.x, p.y);
    throw new Error(`${label} needs ref (from desktop_observe) or x/y (from desktop_screenshot).`);
  }

  async _refCenter(w, p, label) {
    const ref = Number(p.ref);
    if (!this._observation.isFor(w.hwnd)) throw new Error(UiaObservation.NOT_OBSERVED);
    const node = this._observation.node(w.hwnd, ref);
    if (!node) throw new Error(`${label}.ref ${p.ref} is not in the last observation; observe again.`);
    const { rect } = await this.rectOf(ref, node);
    return { sx: rect[0] + rect[2] / 2, sy: rect[1] + rect[3] / 2 };
  }
}

module.exports = RefLocator;
