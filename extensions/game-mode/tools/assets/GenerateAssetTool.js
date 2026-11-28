const AssetTool = require('./AssetTool');
const AssetSpec = require('../../assets/AssetSpec');
const ImageCapability = require('../../assets/ImageCapability');

class GenerateAssetTool extends AssetTool {
  get name() { return 'generate_asset'; }

  get description() {
    return 'Create ONE image asset (sprite, backdrop, tile) for the game with AI image generation. '
      + 'Writes a correctly-sized placeholder PNG to the given assets/ path immediately, so the game loads '
      + 'and lays out right away, and queues the real image: it renders right after your reply ends and replaces '
      + 'the placeholder by itself, so keep building and never wait for it. For sprites, pass transparent: true '
      + 'to have the background removed automatically; leave it off for full-canvas backdrops. '
      + 'When you need MORE THAN ONE asset, call generate_assets with the whole array instead.';
  }

  get inputSchema() {
    return { type: 'object', properties: AssetTool.ASSET_PROPS, required: ['path', 'prompt'] };
  }

  async run(params, opts = {}) {
    const session = this._scope.session();
    const model = this._modelFor(params);
    const native = await ImageCapability.nativeSize(this._scope.chat, model);
    const spec = AssetSpec.prepare({ s: session, params, artStyle: this._artStyle, native, modelRef: model, palette: this._palette });
    if (spec.error) return { success: false, error: spec.error };
    spec.modelRef = model;
    this._queue.enqueue(spec, model, opts.emit);
    return this._queuedResult(spec);
  }

  _queuedResult(spec) {
    return {
      success: true,
      path: spec.rel,
      message: `Wrote a ${spec.width}x${spec.height} placeholder at ${spec.rel} and queued the real image: ${AssetTool.WHEN_IT_LANDS} `
        + `Do not wait for it or request it again. Load it with the relative path "${spec.rel}" and design so the `
        + 'placeholder also reads.'
        + (spec.alphaUnavailable ? ' Transparency is unavailable in this install, so the image will be opaque.' : '')
        + (spec.styleNote ? ` (${spec.styleNote}.)` : ''),
      summary: `${spec.rel} · ${spec.width}x${spec.height} queued`,
    };
  }
}

module.exports = GenerateAssetTool;
