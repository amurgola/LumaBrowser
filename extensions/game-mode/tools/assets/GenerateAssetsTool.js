const AssetTool = require('./AssetTool');
const AssetJob = require('../../assets/AssetJob');
const AssetSpec = require('../../assets/AssetSpec');
const ImageCapability = require('../../assets/ImageCapability');
const ImageModelPins = require('../../assets/ImageModelPins');
const InlineAssetGenerator = require('../../assets/InlineAssetGenerator');
const GameSnapshot = require('../../session/GameSnapshot');

class GenerateAssetsTool extends AssetTool {
  static MAX_BATCH_ASSETS = 12;

  get name() { return 'generate_assets'; }

  get description() {
    return 'Create SEVERAL image assets in ONE call: pass an array of specs, each shaped exactly '
      + 'like a generate_asset call. Always prefer this over repeated generate_asset calls when a build '
      + 'needs more than one asset: every image generates back-to-back on a single image-model load '
      + '(on machines that swap models per generation, one call per asset reloads the model every time). '
      + `Placeholders are written for all of them immediately. Up to ${GenerateAssetsTool.MAX_BATCH_ASSETS} per call.`;
  }

  get inputSchema() {
    return {
      type: 'object',
      properties: {
        assets: {
          type: 'array',
          description: `Asset specs (max ${GenerateAssetsTool.MAX_BATCH_ASSETS}), each {path, prompt, width?, height?, style?, transparent?}`,
          items: { type: 'object', properties: AssetTool.ASSET_PROPS, required: ['path', 'prompt'] },
        },
      },
      required: ['assets'],
    };
  }

  async run(params, opts = {}) {
    const s = this._scope.session();
    const list = params && Array.isArray(params.assets) ? params.assets : null;
    if (!list || !list.length) return { success: false, error: 'assets must be a non-empty array of {path, prompt, …} specs' };
    const batch = list.slice(0, GenerateAssetsTool.MAX_BATCH_ASSETS);
    const lines = [];
    const specs = await this._prepareAll(s, batch, lines);
    if (!specs.length) return { success: false, error: `No assets could be processed:\n${lines.join('\n')}` };
    const ordered = ImageModelPins.orderSpecs(specs, this._pins);
    const counts = ImageCapability.canGenerateInline(this._scope.chat)
      ? await this._generateAll(s, ordered, lines, opts.emit)
      : GenerateAssetsTool._queueAll(s, ordered, lines, opts.emit);
    return GenerateAssetsTool._result(batch.length, list.length - batch.length, counts, lines);
  }

  async _prepareAll(s, batch, lines) {
    const natives = new Map();
    const specs = [];
    for (const item of batch) {
      const model = this._modelFor(item);
      if (!natives.has(model || '')) natives.set(model || '', await ImageCapability.nativeSize(this._scope.chat, model));
      const spec = AssetSpec.prepare({ s, params: item, artStyle: this._artStyle, native: natives.get(model || '') });
      if (spec.error) {
        lines.push(`- ${(item && item.path) || '(no path)'}: FAILED: ${spec.error}`);
        continue;
      }
      spec.modelRef = model;
      specs.push(spec);
    }
    return specs;
  }

  async _generateAll(s, ordered, lines, emit) {
    let generated = 0;
    for (const spec of ordered) {
      const r = await InlineAssetGenerator.generate({ chat: this._scope.chat, s, spec, modelRef: spec.modelRef, emit });
      if (r.status === 'done') {
        generated += 1;
        lines.push(`- ${spec.rel} (${spec.width}x${spec.height}) generated${r.notes ? `: ${r.notes}` : ''}`);
      } else if (r.status === 'error') {
        lines.push(`- ${spec.rel}: FAILED: ${r.error}`);
      } else {
        lines.push(`- ${spec.rel} (${spec.width}x${spec.height}) generation failed; the solid-colour placeholder stands`);
      }
    }
    return { generated, queued: 0 };
  }

  static _queueAll(s, ordered, lines, emit) {
    for (const spec of ordered) {
      AssetJob.queue(s, spec, spec.modelRef);
      lines.push(`- ${spec.rel} (${spec.width}x${spec.height}) queued`
        + (spec.alphaUnavailable ? ' (transparency unavailable in this install, will be opaque)' : '')
        + (spec.styleNote ? ` (${spec.styleNote})` : ''));
    }
    GameSnapshot.emit(emit, s);
    return { generated: 0, queued: ordered.length };
  }

  static _result(batchSize, overflow, { generated, queued }, lines) {
    const head = generated
      ? `Generated ${generated} of ${batchSize} asset${batchSize === 1 ? '' : 's'}:`
      : `Wrote ${queued} correctly-sized placeholder${queued === 1 ? '' : 's'}; the real images will be generated `
        + 'back-to-back right after this turn ends (this machine generates images between turns):';
    const tail = [
      'Load each in the game with its relative path' + (queued ? ', and design so the solid-colour placeholders also read.' : '.'),
      overflow
        ? `NOTE: only the first ${GenerateAssetsTool.MAX_BATCH_ASSETS} specs were processed; the remaining ${overflow} were `
          + 'NOT; call generate_assets again with the rest.'
        : '',
    ].filter(Boolean).join(' ');
    return {
      success: true,
      message: `${head}\n${lines.join('\n')}\n${tail}`,
      summary: generated ? `${generated}/${batchSize} assets generated` : `${queued}/${batchSize} assets queued`,
    };
  }
}

module.exports = GenerateAssetsTool;
