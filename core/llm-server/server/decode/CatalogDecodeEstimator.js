const MemoryBandwidth = require('../../MemoryBandwidth');
const DecodeFormula = require('./DecodeFormula');

class CatalogDecodeEstimator {
  static GB = 1024 * 1024 * 1024;

  static MIN_USABLE_VRAM = 1.5 * CatalogDecodeEstimator.GB;

  static CARD_OVERHEAD = CatalogDecodeEstimator.GB;

  static PLACEMENT_DEPTH = 8192;

  static estimate(variant, hw) {
    try {
      return new CatalogDecodeEstimator(variant, hw).execute();
    } catch (_) {
      return null;
    }
  }

  static coarseHistoryBytesPerToken(paramsB) {
    const params = Number(paramsB) || 7;
    return (params / 7) * (2 * CatalogDecodeEstimator.GB) / 32768;
  }

  constructor(variant, hw) {
    this._variant = variant || {};
    this._hw = hw || {};
    this._domains = [];
    this._onGpu = 0;
  }

  execute() {
    this._weights = Number(this._variant.approxBytes) || 0;
    if (!(this._weights > 0)) return null;
    this._resolveStreams();
    this._placeOnGpus();
    if (!this._placeRemainderOnCpu()) return null;
    return this._result();
  }

  _resolveStreams() {
    const paramsB = Number(this._variant.paramsB) || 0;
    const activeB = Number(this._variant.activeParamsB) || 0;
    const activeFraction = (paramsB > 0 && activeB > 0) ? Math.min(1, activeB / paramsB) : 1;
    this._streamed = this._weights * activeFraction;
    this._contextTokens = Math.max(8192, Math.floor(Number(this._variant.maxContext) || 0) || 32768);
    this._historyPerToken = CatalogDecodeEstimator.coarseHistoryBytesPerToken(paramsB);
  }

  _placeOnGpus() {
    const vram = Math.max(0, Number(this._hw.usableVramBytes) || 0);
    const cards = this._cardsFastestFirst(vram);
    if (!(vram > CatalogDecodeEstimator.MIN_USABLE_VRAM) || cards.length === 0) return;
    let remaining = this._weights;
    for (const card of cards) {
      const take = Math.min(remaining, this._roomOn(card));
      if (take <= 0) continue;
      this._addDomain('gpu', card.bandwidth, take / this._weights);
      remaining -= take;
      this._onGpu += take;
      if (remaining <= 0) break;
    }
  }

  _cardsFastestFirst(vram) {
    const listed = Array.isArray(this._hw.gpus) && this._hw.gpus.length ? this._hw.gpus : null;
    const cards = listed || (vram > 0 ? [{ name: this._hw.gpuName, totalBytes: vram, maxBytes: vram }] : []);
    return cards
      .map((card) => ({ ...card, bandwidth: MemoryBandwidth.resolveGpuBandwidth(card) }))
      .sort((a, b) => b.bandwidth.gbps - a.bandwidth.gbps);
  }

  _roomOn(card) {
    const capacity = Number(card.maxBytes) || Number(card.totalBytes) || 0;
    const reserve = CatalogDecodeEstimator.CARD_OVERHEAD + this._historyPerToken * CatalogDecodeEstimator.PLACEMENT_DEPTH;
    return Math.max(0, capacity - reserve);
  }

  _placeRemainderOnCpu() {
    this._cpuShare = Math.max(0, this._weights - this._onGpu) / this._weights;
    if (this._cpuShare <= 0) return true;
    const ram = Math.max(0, Number(this._hw.usableRamBytes) || 0);
    if (this._onGpu === 0 && ram > 0 && this._weights > ram) return false;
    this._addDomain('cpu', this._ramBandwidth(), this._cpuShare);
    return true;
  }

  _ramBandwidth() {
    const reported = Number(this._hw.ramBandwidthGbps);
    return reported > 0 ? { gbps: reported, source: 'modules' } : MemoryBandwidth.resolveRamBandwidth(null);
  }

  _addDomain(kind, bandwidth, share) {
    const historyPerToken = this._historyPerToken;
    this._domains.push({
      kind,
      bandwidthGbps: bandwidth.gbps,
      bandwidthSource: bandwidth.source,
      weightBytesPerToken: this._streamed * share,
      historyBytesPerToken: (depth) => historyPerToken * depth * share,
    });
  }

  _tpsAt(depth) {
    const fixedMs = this._cpuShare > 0 ? DecodeFormula.CPU_STEP_MS : DecodeFormula.GPU_STEP_MS;
    return DecodeFormula.estimateTps({ domains: this._domains, fixedMs, depth: Math.min(depth, this._contextTokens) });
  }

  _result() {
    return {
      at8k: this._tpsAt(8192),
      at32k: this._tpsAt(32768),
      atFull: this._tpsAt(this._contextTokens),
      fullTokens: this._contextTokens,
      source: DecodeFormula.bandwidthSourceOf(this._domains),
      confidence: 'low',
      speculative: 'excluded',
    };
  }
}

module.exports = CatalogDecodeEstimator;
