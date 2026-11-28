const AssetTool = require('./AssetTool');
const AssetSpec = require('../../assets/AssetSpec');
const ImageCapability = require('../../assets/ImageCapability');
const ImageModelPins = require('../../assets/ImageModelPins');

class GenerateAssetsTool extends AssetTool {
  static MAX_BATCH_ASSETS = 12;

  get name() { return 'generate_assets'; }

  get description() {
    return 'Create SEVERAL image assets in ONE call: pass an array of specs, each shaped exactly '
      + 'like a generate_asset call. Always prefer this over repeated generate_asset calls when a build '
      + 'needs more than one asset: the renders queue back-to-back on a single image-model load. '
      + 'Placeholders are written for all of them immediately and the real images replace them right after '
      + `your reply ends, so keep building and never wait for them. Up to ${GenerateAssetsTool.MAX_BATCH_ASSETS} per call.`;
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
    const session = this._scope.session();
    const list = params && Array.isArray(params.assets) ? params.assets : null;
    if (!list || !list.length) return { success: false, error: 'assets must be a non-empty array of {path, prompt, …} specs' };
    const batch = list.slice(0, GenerateAssetsTool.MAX_BATCH_ASSETS);
    const lines = [];
    const specs = await this._prepareAll(session, batch, lines);
    if (!specs.length) return { success: false, error: `No assets could be processed:\n${lines.join('\n')}` };
    const ordered = ImageModelPins.orderSpecs(specs, this._pins);
    this._queueAll(ordered, lines, opts.emit);
    return this._result(batch.length, list.length - batch.length, ordered.length, lines);
  }

  async _prepareAll(session, batch, lines) {
    const natives = new Map();
    const specs = [];
    for (const item of batch) {
      const model = this._modelFor(item);
      if (!natives.has(model || '')) natives.set(model || '', await ImageCapability.nativeSize(this._scope.chat, model));
      const spec = AssetSpec.prepare({ s: session, params: item, artStyle: this._artStyle, native: natives.get(model || ''), modelRef: model, palette: this._palette });
      if (spec.error) {
        lines.push(`- ${(item && item.path) || '(no path)'}: FAILED: ${spec.error}`);
        continue;
      }
      spec.modelRef = model;
      specs.push(spec);
    }
    return specs;
  }

  _queueAll(ordered, lines, emit) {
    for (const spec of ordered) {
      this._queue.enqueue(spec, spec.modelRef, emit);
      lines.push(`- ${spec.rel} (${spec.width}x${spec.height}) queued${spec.modelRef ? ` on ${spec.modelRef}` : ''}`
        + (spec.alphaUnavailable ? ' (transparency unavailable in this install, will be opaque)' : '')
        + (spec.styleNote ? ` (${spec.styleNote})` : ''));
    }
  }

  _result(batchSize, overflow, queued, lines) {
    const head = `Wrote ${queued} correctly-sized placeholder${queued === 1 ? '' : 's'} and queued the real `
      + `image${queued === 1 ? '' : 's'}; each one: ${AssetTool.WHEN_IT_LANDS}`;
    const tail = [
      'Do not wait for them or request them again. Load each in the game with its relative path, and design so the placeholders also read.',
      overflow
        ? `NOTE: only the first ${GenerateAssetsTool.MAX_BATCH_ASSETS} specs were processed; the remaining ${overflow} were `
          + 'NOT; call generate_assets again with the rest.'
        : '',
    ].filter(Boolean).join(' ');
    return {
      success: true,
      message: `${head}\n${lines.join('\n')}\n${tail}`,
      summary: `${queued}/${batchSize} assets queued`,
    };
  }
}

module.exports = GenerateAssetsTool;
