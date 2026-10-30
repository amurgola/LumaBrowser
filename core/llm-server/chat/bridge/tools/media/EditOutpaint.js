const OutpaintCanvas = require('../../../../../image-server/region/OutpaintCanvas');
const RegionComposite = require('../../../../../image-server/region/RegionComposite');

class EditOutpaint {
  static ANCHORS = OutpaintCanvas.ANCHORS;

  static prepare({ frame, canvas, srcBuf, anchor }) {
    if (!frame || frame === 'match' || !canvas || !srcBuf) return null;
    const built = OutpaintCanvas.build({ sourceBytes: srcBuf, width: canvas.width, height: canvas.height, anchor: EditOutpaint.anchorOf(anchor) });
    return built ? new EditOutpaint(built, canvas, EditOutpaint.anchorOf(anchor)) : null;
  }

  static anchorOf(raw) {
    const a = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
    return EditOutpaint.ANCHORS.includes(a) ? a : OutpaintCanvas.DEFAULT_ANCHOR;
  }

  constructor(built, canvas, anchor) {
    this._built = built;
    this._canvas = { width: canvas.width, height: canvas.height };
    this._anchor = anchor;
  }

  get canvasDims() {
    return this._canvas;
  }

  get sides() {
    return this._built.sides;
  }

  get anchor() {
    return this._anchor;
  }

  sourceBytes() {
    return this._built.png;
  }

  sourceBase64() {
    return this._built.png.toString('base64');
  }

  inpaintMask() {
    return this._built.maskPng;
  }

  promptHint() {
    return `The picture has been extended with empty space ${EditOutpaint.where(this.sides)}; fill that new space by `
      + 'continuing the scene naturally and seamlessly, matching its perspective, lighting and style. '
      + 'The original part of the picture stays exactly as it is.';
  }

  static where(sides) {
    const names = (sides && sides.length ? sides : ['edges']).map((s) => `the ${s}`);
    const joined = names.length <= 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
    return `on ${joined}`;
  }

  finish(image) {
    if (!image || !image.bytes) return { ...image, composited: false };
    const out = RegionComposite.apply({
      sourceBytes: this._built.png,
      outputBytes: image.bytes,
      grown: this._built.grown,
      featherPx: this._built.featherPx,
      rect: null,
    });
    if (!out) return { ...image, composited: false };
    return { ...image, bytes: out.bytes, mime: out.mime, width: out.width, height: out.height, composited: true };
  }

  summary(composited) {
    const kept = composited
      ? 'the original pixels are kept in place and only the new space was filled'
      : 'the raw render is kept (no bitmap codec to restore the original pixels)';
    return `; extended ${EditOutpaint.where(this.sides)} into a ${this._canvas.width}x${this._canvas.height} frame with the original at the ${this._anchor}; ${kept}`;
  }
}

module.exports = EditOutpaint;
