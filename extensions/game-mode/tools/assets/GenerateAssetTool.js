const AssetTool = require('./AssetTool');
const AssetJob = require('../../assets/AssetJob');
const AssetSpec = require('../../assets/AssetSpec');
const ImageCapability = require('../../assets/ImageCapability');
const InlineAssetGenerator = require('../../assets/InlineAssetGenerator');
const GameSnapshot = require('../../session/GameSnapshot');

class GenerateAssetTool extends AssetTool {
  get name() { return 'generate_asset'; }

  get description() {
    return 'Create ONE image asset (sprite, backdrop, tile) for the game with AI image generation. '
      + 'Writes a correctly-sized solid-colour placeholder PNG to the given assets/ path immediately, so '
      + 'the game loads and lays out right away; the real image replaces it, either during this turn or '
      + 'right after it, depending on this machine\'s GPUs. For sprites, pass transparent: true to have '
      + 'the background removed automatically; leave it off for full-canvas backdrops. '
      + 'When you need MORE THAN ONE asset, call generate_assets with the whole array instead.';
  }

  get inputSchema() {
    return { type: 'object', properties: AssetTool.ASSET_PROPS, required: ['path', 'prompt'] };
  }

  async run(params, opts = {}) {
    const s = this._scope.session();
    const chat = this._scope.chat;
    const model = this._modelFor(params);
    const spec = AssetSpec.prepare({ s, params, artStyle: this._artStyle, native: await ImageCapability.nativeSize(chat, model) });
    if (spec.error) return { success: false, error: spec.error };
    spec.modelRef = model;
    if (ImageCapability.canGenerateInline(chat)) return GenerateAssetTool._inlineResult(spec, await InlineAssetGenerator.generate({ chat, s, spec, modelRef: model, emit: opts.emit }));
    AssetJob.queue(s, spec, model);
    GameSnapshot.emit(opts.emit, s);
    return GenerateAssetTool._queuedResult(spec);
  }

  static _inlineResult(spec, r) {
    if (r.status === 'error') return { success: false, error: r.error };
    if (r.status === 'done') {
      return {
        success: true,
        path: spec.rel,
        message: `Generated ${spec.rel} (${spec.width}x${spec.height}${r.notes ? `, ${r.notes}` : ''}). `
          + `Load it in the game with a relative path: "${spec.rel}".`,
        summary: `${spec.rel} · ${spec.width}x${spec.height} generated`,
      };
    }
    return {
      success: true,
      path: spec.rel,
      message: `Image generation failed, so ${spec.rel} is a ${spec.width}x${spec.height} solid-colour placeholder. `
        + 'The game still works; design so the placeholder reads, and continue.',
      summary: `${spec.rel} · placeholder (generation failed)`,
    };
  }

  static _queuedResult(spec) {
    return {
      success: true,
      path: spec.rel,
      message: `Wrote a ${spec.width}x${spec.height} placeholder at ${spec.rel}; the real image will be generated right `
        + 'after this turn ends (this machine generates images between turns). Load it with the relative path '
        + `"${spec.rel}" and design so the solid-colour placeholder also reads.`
        + (spec.alphaUnavailable ? ' Transparency is unavailable in this install, so the image will be opaque.' : '')
        + (spec.styleNote ? ` (${spec.styleNote}.)` : ''),
      summary: `${spec.rel} · ${spec.width}x${spec.height} queued`,
    };
  }
}

module.exports = GenerateAssetTool;
