const fs = require('fs');
const path = require('path');
const AssetSizing = require('./AssetSizing');
const AssetSpec = require('./AssetSpec');
const ImageCapability = require('./ImageCapability');
const ImageModelPins = require('./ImageModelPins');
const InlineAssetGenerator = require('./InlineAssetGenerator');
const RuntimeImageIndex = require('./RuntimeImageIndex');

class RuntimeAssetGenerator {
  static DIR = 'assets/runtime';

  static _chain = Promise.resolve();

  static generate(options) {
    const run = () => new RuntimeAssetGenerator(options).execute();
    const pending = RuntimeAssetGenerator._chain.then(run, run);
    RuntimeAssetGenerator._chain = pending.catch(() => {});
    return pending;
  }

  constructor({ context, s, params = {}, artStyle, imageModelRef, emit }) {
    this._chat = context && context.chat;
    this._s = s;
    this._params = params;
    this._artStyle = artStyle;
    this._pins = ImageModelPins.normalize(imageModelRef);
    this._emit = emit;
  }

  async execute() {
    const prompt = String(this._params.prompt || '').trim();
    if (!prompt) return { success: false, error: 'prompt is required' };
    this._resolveIdentity(prompt);
    const cached = this._cachedResult();
    if (cached) return cached;
    const spec = await this._prepare(prompt);
    if (spec.error) return { success: false, error: spec.error };
    const status = await this._render(spec);
    if (status.error) return { success: false, error: status.error, path: spec.rel, url: spec.rel, status: 'error' };
    this._remember(spec, prompt, status.value);
    return { success: true, path: spec.rel, url: spec.rel, status: status.value, width: spec.width, height: spec.height };
  }

  _resolveIdentity(prompt) {
    this._index = RuntimeImageIndex.read(this._s.dir);
    const key = this._params.key ? String(this._params.key).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 48) : '';
    this._hash = RuntimeImageIndex.requestHash({ ...this._params, prompt });
    this._id = key || this._hash;
  }

  _cachedResult() {
    const hit = this._index[this._id];
    if (!hit || hit.hash !== this._hash || hit.status !== 'done') return null;
    if (!fs.existsSync(path.join(this._s.dir, hit.rel))) return null;
    return { success: true, path: hit.rel, url: hit.rel, status: 'done', width: hit.width, height: hit.height, cached: true };
  }

  async _prepare(prompt) {
    const modelRef = ImageModelPins.modelFor({
      width: AssetSizing.clampDim(this._params.width),
      height: AssetSizing.clampDim(this._params.height),
      transparent: !!this._params.transparent,
    }, this._pins);
    const native = await ImageCapability.nativeSize(this._chat, modelRef);
    const rel = `${RuntimeAssetGenerator.DIR}/${this._id}.png`;
    const spec = AssetSpec.prepare({ s: this._s, params: { ...this._params, prompt, path: rel }, artStyle: this._artStyle, native });
    if (!spec.error) spec.modelRef = modelRef;
    return spec;
  }

  async _render(spec) {
    if (!ImageCapability.isReady(this._chat)) return { value: 'placeholder' };
    const inline = ImageCapability.canGenerateInline(this._chat);
    if (!inline) await ImageCapability.beginExclusive(this._chat);
    try {
      const r = await InlineAssetGenerator.generate({ chat: this._chat, s: this._s, spec, modelRef: spec.modelRef, emit: this._emit });
      if (r.status === 'error') return { error: r.error };
      return { value: r.status === 'done' ? 'done' : 'placeholder' };
    } finally {
      if (!inline) ImageCapability.endExclusive(this._chat);
    }
  }

  _remember(spec, prompt, status) {
    this._index[this._id] = { hash: this._hash, rel: spec.rel, status, width: spec.width, height: spec.height, prompt: prompt.slice(0, 200) };
    try { RuntimeImageIndex.write(this._s.dir, this._index); } catch (_) {}
  }
}

module.exports = RuntimeAssetGenerator;
