const path = require('path');
const ByteLadder = require('../ByteLadder');
const GpuOverhead = require('./GpuOverhead');
const HybridAttentionLayout = require('./HybridAttentionLayout');
const LayerFillSplit = require('./LayerFillSplit');

class PlacementNotes {
  static build(state) {
    return new PlacementNotes(state).execute();
  }

  constructor(state) {
    this._s = state;
    this._notes = [];
  }

  execute() {
    this._noteRuntime();
    this._noteModel();
    this._noteHeader();
    this._noteVram();
    this._noteNeed();
    this._noteDecision();
    this._noteContext();
    return this._notes;
  }

  _noteRuntime() {
    const { flags } = this._s;
    const where = flags.binaryPath ? path.basename(path.dirname(flags.binaryPath)) : flags.id;
    this._notes.push(`Runtime: ${flags.name} (${where}).`);
  }

  _noteModel() {
    const { files, vision } = this._s;
    const projector = files.mmprojBytes > 0
      ? ` + ${ByteLadder.format(files.mmprojBytes)} mmproj${vision.effectiveMmprojBytes > 0 ? '' : ' (not loaded this launch, text-only)'}`
      : '';
    this._notes.push(`Model: ${files.name}, ${ByteLadder.format(this._s.model.weightsTotalBytes)}${projector}.`);
  }

  _noteHeader() {
    const { files } = this._s;
    const gguf = files.gguf;
    if (gguf) {
      const bits = [];
      if (gguf.architecture) bits.push(gguf.architecture);
      if (gguf.blockCount) bits.push(`${gguf.blockCount} layers`);
      if (gguf.contextLength) bits.push(`native ctx ${gguf.contextLength}`);
      if (gguf.fileTypeName) bits.push(gguf.fileTypeName);
      if (bits.length > 0) this._notes.push(`GGUF header: ${bits.join(' · ')}.`);
    } else if (files.rawGguf && files.rawGguf.parsed === false) {
      this._notes.push(`GGUF header: unreadable (${files.rawGguf.error}); layer-aware split unavailable, using all-or-nothing offload.`);
    }
  }

  _noteVram() {
    const { budget } = this._s;
    const cards = budget.perGpu.length;
    if (cards > 0) {
      this._notes.push(`VRAM usable: ${ByteLadder.format(budget.vramAvailableBytes)} across ${cards} adapter${cards === 1 ? '' : 's'} (after 1 GB/card reserve).`);
    } else {
      this._notes.push('No GPU VRAM detected; CPU inference only.');
    }
  }

  _noteNeed() {
    const { files, offload } = this._s;
    if (!files.gguf) {
      this._notes.push(`Estimated VRAM need (model + 20% overhead): ${ByteLadder.format(offload.modelEstimatedBytes)}.`);
      return;
    }
    this._notes.push(`Estimated VRAM need: ${ByteLadder.format(offload.modelEstimatedBytes)} (${this._needBreakdown().join(' + ')}).`);
  }

  _needBreakdown() {
    const { files, vision, kv, flags, spec } = this._s;
    const parts = [`${ByteLadder.format(this._s.model.weightsTotalBytes)} weights`];
    if (vision.effectiveMmprojBytes > 0) parts.push(`${ByteLadder.format(vision.effectiveMmprojBytes)} mmproj`);
    const kvLabel = kv.cacheTypeK === 'q8_0' || kv.cacheTypeV === 'q8_0' ? 'q8 KV' : 'f16 KV';
    const hybrid = HybridAttentionLayout.of(files.gguf);
    parts.push(hybrid
      ? `${kvLabel} cache @ ${kv.contextSize} ctx on ${hybrid.kvLayers}/${hybrid.totalLayers} attention layers (the other ${hybrid.totalLayers - hybrid.kvLayers} are linear-attention blocks with a constant-size state, no KV)`
      : `${kvLabel} cache @ ${kv.contextSize} ctx`);
    parts.push(`${ByteLadder.format(GpuOverhead.fixed(flags.flashAttn))} GPU scratch${flags.flashAttn ? '' : ' (no FA)'}`);
    if (spec.mtpEnabled) parts.push('MTP draft branch');
    return parts;
  }

  _noteDecision() {
    const { offload } = this._s;
    if (offload.fullOffload) this._noteFullOffload();
    else if (offload.partial) this._notePartialOffload(offload.partial);
    else this._noteCpuOnly();
  }

  _noteFullOffload() {
    const { budget, splits, offload } = this._s;
    const cards = budget.perGpu.length;
    if (splits.layerFill) {
      this._notes.push(`Decision: full GPU offload across ${cards} adapters, filling the fastest card first (--tensor-split ${splits.layerFill.ratio}: ${LayerFillSplit.describe(splits.layerFill)}). llama.cpp's default would split layers by card size instead, leaving the fast card partly empty while the slow card decodes a larger share of every token.`);
    } else if (offload.singleGpuFits) {
      const card = budget.perGpu[budget.largestGpuIndex];
      this._notes.push(`Decision: full GPU offload across all ${cards} adapters via llama.cpp's default layer split. The model would fit on ${card.name} alone (${ByteLadder.format(card.totalBytes)}). The launcher normally pins that card via CUDA_VISIBLE_DEVICES, so a multi-card spread here means pinning was disabled (core.llmServer.cudaDevice override) or another server currently holds the card. A cross-card layer split decodes at the slower card's pace; prefer the single-card pin when it fits.`);
    } else {
      this._notes.push(`Decision: full GPU offload across all ${cards} adapters using llama.cpp's default layer split.`);
    }
  }

  _notePartialOffload(partial) {
    const { splits, kv } = this._s;
    const fmt = ByteLadder.format;
    if (partial.ngl > 0) {
      if (splits.layerFill) this._notes.push(`GPU layers split fastest-card-first (--tensor-split ${splits.layerFill.ratio}: ${LayerFillSplit.describe(splits.layerFill)}).`);
      const reserved = partial.mtpOverheadBytes ? ` (after ${fmt(partial.mtpOverheadBytes)} reserved for the MTP draft branch)` : '';
      this._notes.push(
        `Decision: partial GPU offload, ${partial.ngl}/${partial.layerCount} layers on GPU, `
        + `${partial.layerCount - partial.ngl} on CPU. `
        + `~${fmt(partial.perLayerBytes)}/layer (${fmt(partial.perLayerWeightBytes)} weights + `
        + `${fmt(partial.kvPerLayerBytes)} KV cache @ ${kv.contextSize} ctx) against a `
        + `${fmt(partial.budgetBytes)} usable VRAM budget${reserved}.`,
      );
      return;
    }
    const reserved = partial.mtpOverheadBytes
      ? ` MTP draft branch reserved ${fmt(partial.mtpOverheadBytes)} of that; disable MTP to recover the headroom.`
      : '';
    this._notes.push(
      'Decision: CPU only (-ngl 0): even one layer plus its KV cache '
      + `(~${fmt(partial.perLayerBytes)}) exceeds the ${fmt(partial.budgetBytes)} VRAM budget.${reserved}`,
    );
  }

  _noteCpuOnly() {
    const { budget, files } = this._s;
    if (budget.perGpu.length > 0 && files.gguf) {
      this._notes.push(
        `Decision: CPU only (-ngl 0): usable VRAM (${ByteLadder.format(budget.vramAvailableBytes)}) is at or `
        + 'below the fixed GPU overhead, leaving no room for even one layer.',
      );
    } else if (budget.perGpu.length > 0) {
      this._notes.push(
        'Decision: CPU only (-ngl 0): model doesn\'t fit in VRAM and the GGUF header '
        + 'couldn\'t be read, so a safe partial split can\'t be sized.',
      );
    } else {
      this._notes.push('Decision: CPU only (-ngl 0): no usable GPU.');
    }
  }

  _noteContext() {
    const { kv, files } = this._s;
    const native = files.gguf && files.gguf.contextLength === kv.contextSize ? ' (model native max)' : '';
    this._notes.push(`Context: ${kv.contextSize} tokens${native}.`);
  }
}

module.exports = PlacementNotes;
