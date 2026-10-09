const fs = require('fs');
const AssetJob = require('./AssetJob');
const AssetPostChain = require('./AssetPostChain');
const ImageCapability = require('./ImageCapability');
const ImageModelPins = require('./ImageModelPins');

class PendingAssetDrainer {
  static drain({ context, s, emit }) {
    return new PendingAssetDrainer({ context, s, emit }).execute();
  }

  constructor({ context, s, emit }) {
    this._chat = context && context.chat;
    this._s = s;
    this._emit = emit;
  }

  async execute() {
    const s = this._s;
    if (!s || !Array.isArray(s.pendingAssets) || !s.pendingAssets.length) return;
    const queue = ImageModelPins.orderSpecs(s.pendingAssets.splice(0), null);
    if (!this._canGenerate()) return this._keepPlaceholders(queue);
    await ImageCapability.beginExclusive(this._chat);
    try {
      for (const job of queue) await this._generate(job);
    } finally {
      ImageCapability.endExclusive(this._chat);
    }
  }

  _canGenerate() {
    return !!(this._chat && typeof this._chat.generateImage === 'function') && ImageCapability.isReady(this._chat);
  }

  _keepPlaceholders(queue) {
    for (const job of queue) this._s.assets.set(job.rel, { status: 'placeholder' });
    AssetJob.mark(this._s, queue[0].rel, 'placeholder', this._emit);
  }

  async _generate(job) {
    const img = await this._render(job);
    if (!(img && img.b64)) return AssetJob.mark(this._s, job.rel, 'placeholder', this._emit);
    let status = 'done';
    try {
      const { buf } = await AssetPostChain.apply(Buffer.from(img.b64, 'base64'), job);
      fs.writeFileSync(job.abs, buf);
    } catch (_) { status = 'error'; }
    return AssetJob.mark(this._s, job.rel, status, this._emit);
  }

  async _render(job) {
    try { return await this._chat.generateImage(AssetJob.request(job)); } catch (_) { return null; }
  }
}

module.exports = PendingAssetDrainer;
