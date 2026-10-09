const fs = require('fs');
const AssetJob = require('./AssetJob');
const AssetPostChain = require('./AssetPostChain');

class InlineAssetGenerator {
  static generate({ chat, s, spec, modelRef, emit }) {
    return new InlineAssetGenerator({ chat, s, spec, modelRef, emit }).execute();
  }

  constructor({ chat, s, spec, modelRef, emit }) {
    this._chat = chat;
    this._s = s;
    this._spec = spec;
    this._job = AssetJob.fromSpec(spec, modelRef);
    this._emit = emit;
  }

  async execute() {
    AssetJob.mark(this._s, this._spec.rel, 'pending', this._emit);
    const img = await this._render();
    if (!(img && img.b64)) return this._placeholderStands();
    try {
      const { buf, keyed } = await AssetPostChain.apply(Buffer.from(img.b64, 'base64'), this._job);
      fs.writeFileSync(this._spec.abs, buf);
      AssetJob.mark(this._s, this._spec.rel, 'done', this._emit);
      return { status: 'done', notes: this._notes(keyed) };
    } catch (e) {
      AssetJob.mark(this._s, this._spec.rel, 'error', this._emit);
      return { status: 'error', notes: '', error: `Generated the image but could not write ${this._spec.rel}: ${e.message}` };
    }
  }

  async _render() {
    try { return await this._chat.generateImage(AssetJob.request(this._job)); } catch (_) { return null; }
  }

  _placeholderStands() {
    AssetJob.mark(this._s, this._spec.rel, 'placeholder', this._emit);
    return { status: 'placeholder', notes: '' };
  }

  _notes(keyed) {
    const spec = this._spec;
    return [
      spec.modelRef ? `on ${spec.modelRef}` : '',
      InlineAssetGenerator._pixelNote(spec),
      !spec.isPixel && spec.needsSmooth ? `generated at ${spec.genW}x${spec.genH}, downscaled` : '',
      keyed === true ? 'transparent background' : '',
      keyed === false ? 'background could not be keyed, kept opaque' : '',
      spec.alphaUnavailable ? 'transparency unavailable in this install, image is opaque' : '',
      spec.styleNote,
    ].filter(Boolean).join(', ');
  }

  static _pixelNote(spec) {
    if (!spec.isPixel) return '';
    if (spec.pixelScale > 1) {
      return `pixel-art on a ${spec.logicalW}x${spec.logicalH} grid at ${spec.pixelScale}x (${spec.pixelScale}px pixels)`;
    }
    return 'pixel-art post-processed';
  }
}

module.exports = InlineAssetGenerator;
