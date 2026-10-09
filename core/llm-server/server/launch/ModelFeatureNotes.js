const path = require('path');
const ByteLadder = require('../ByteLadder');
const KvCacheType = require('./KvCacheType');
const SpeculationPlan = require('./SpeculationPlan');

class ModelFeatureNotes {
  static build(state) {
    return new ModelFeatureNotes(state).execute();
  }

  constructor(state) {
    this._s = state;
    this._notes = [];
  }

  execute() {
    this._noteKvPrecision();
    this._noteFlashAttention();
    this._noteSwaCache();
    this._noteMtp();
    this._noteNgram();
    this._noteDraftCache();
    this._noteContextShift();
    this._noteSkippedAndAppended();
    return this._notes;
  }

  _noteKvPrecision() {
    const { cacheTypeK, cacheTypeV } = this._s.kv;
    const parts = [];
    if (cacheTypeK) parts.push(`K=${cacheTypeK}`);
    if (cacheTypeV) parts.push(`V=${cacheTypeV}`);
    if (parts.length === 0) return;
    const quantized = KvCacheType.isQuantized(cacheTypeK) || KvCacheType.isQuantized(cacheTypeV);
    this._notes.push(`KV cache precision: ${parts.join(' ')}${quantized ? ', quantized, ~half the KV VRAM vs f16 (slight quality cost).' : ' (full precision).'}`);
  }

  _noteFlashAttention() {
    const { flags, kv } = this._s;
    if (!flags.flashAttn) return;
    this._notes.push(`Flash attention: on${kv.forceFlashAttn ? ' (forced; required for the fit test and any quantized KV cache)' : ' (lower attention VRAM, faster prompt eval)'}.`);
  }

  _noteSwaCache() {
    const { offload } = this._s;
    if (offload.swaFull) {
      this._notes.push('SWA cache: full (--swa-full); multi-turn prompt cache survives across replies on sliding-window models.');
    } else if (offload.swaLayout) {
      const layout = offload.swaLayout;
      const saved = Math.max(0, offload.headerEstimatedBytesSwaFull - offload.headerEstimatedBytesIswa);
      this._notes.push(
        `SWA cache: windowed, ${layout.swaLayers}/${layout.swaLayers + layout.globalLayers} layers cache only ~${layout.window} tokens, `
        + `saving ${ByteLadder.format(saved || 0)} of KV VRAM vs --swa-full. The flag was withheld because the full-context SWA cache would not fit the budget: `
        + 'follow-up replies that edit earlier history re-process the prompt, but the model keeps its GPU offload, the better trade.',
      );
    }
  }

  _noteMtp() {
    const { spec, flags } = this._s;
    if (spec.mtpEnabled && flags.specDialect === 'ik') this._noteIkMtp();
    else if (spec.mtpEnabled) this._noteMainlineMtp();
    else this._noteMtpUnavailable();
  }

  _noteIkMtp() {
    const n = this._s.spec.mtpDraftNMax;
    this._notes.push(`MTP: --spec-type mtp:n_max=${n} (ik_llama's stage grammar; no --spec-draft-n-max and no ngram-mod chain, which measured as a loss on this fork). The model's grafted MTP head drafts up to ${n} tokens per step and the main pass verifies them in parallel.`);
  }

  _noteMainlineMtp() {
    const { spec, files } = this._s;
    const n = spec.mtpDraftNMax;
    this._notes.push(`MTP: --spec-type draft-mtp,ngram-mod with n_max=${n} (ngram-mod n-match=${SpeculationPlan.NGRAM_MOD_N_MATCH}, n-min=${SpeculationPlan.NGRAM_MOD_N_MIN}, n-max=${SpeculationPlan.NGRAM_MOD_N_MAX}). The model's MTP head drafts up to ${n} tokens per step and ngram-mod extends each draft from recent context at ~zero extra inference cost; the main pass verifies them in parallel for a ~1.85-2x generation speedup at typical 70-78% acceptance.`);
    if (files.mtpGrafted && files.mtpHeadOnDisk) {
      this._notes.push(`MTP head: read from the weights themselves: this GGUF has the head grafted in (blk.N.nextn.* tensors), so no -md is emitted. ${path.basename(files.mtpHeadOnDisk)} is sitting beside it but is NOT loaded: it holds the same four tensors, and passing it would put a second copy on the card for no gain. You can delete it.`);
    } else if (spec.mtpDetached) {
      this._notes.push(`MTP head: ${path.basename(files.mtpHeadPath)} (${ByteLadder.format(files.mtpHeadBytes)}), loaded via -md. This repo publishes the head as its own GGUF rather than grafting it into each quant, so llama.cpp has to be pointed at the file; its weights and draft KV are reserved in the VRAM budget.`);
    }
  }

  _noteMtpUnavailable() {
    const { spec, flags, files } = this._s;
    if (!files.mtpCapable) return;
    if (!flags.mtpFlags) {
      this._notes.push(`MTP: model has MTP heads but ${flags.name} doesn't accept --spec-type / --spec-draft-n-max; running without speculative decoding.`);
    } else if (spec.mtpDetachedUnsupportedByDialect) {
      this._notes.push(`MTP: this model ships its draft head as a separate file (${path.basename(files.mtpHeadPath)}); ${flags.name} speaks ik_llama's speculative grammar, which has only been verified with a head grafted into the weights, so this launch runs without speculative decoding.`);
    } else if (spec.mtpDetached && !flags.specDrafterFlags) {
      this._notes.push(`MTP: a separate draft head (${path.basename(files.mtpHeadPath)}) shipped with this model, but ${flags.name} doesn't accept -md / --model-draft in this build; running without speculative decoding.`);
    }
  }

  _noteNgram() {
    if (!this._s.spec.ngramSpecEnabled) return;
    this._notes.push(`N-gram speculation: --spec-type ngram-mod (standalone, draft cap ${SpeculationPlan.NGRAM_SOLO_N_MAX}). No draft model: the stage drafts by matching recent context against itself, a CPU-side lookup costing no VRAM, and the main pass verifies every draft so output cannot change. Measured on Qwen3.8-Flash-Next: +26% generation on code edits, +10% on prose, worst case -6% on adversarial copy output.`);
  }

  _noteDraftCache() {
    const type = this._s.spec.draftCacheType;
    if (!type) return;
    this._notes.push(`Draft KV cache: ${type} (--cache-type-k-draft / --cache-type-v-draft), opt-in. Only the speculative branch's own cache is quantized, never the main one: the main model re-checks every drafted token against its full-precision cache, so this cannot change the output. It measured as a loss on Qwen3.8-27B (no VRAM saved, 20-30% slower generation), so it is off unless asked for.`);
  }

  _noteContextShift() {
    if (!this._s.flags.contextShift) return;
    this._notes.push('Context shift: OFF (--no-context-shift). A full KV cache fails the request instead of silently dropping the oldest half of the conversation, which on an agent run is the system prompt and the tool contract.');
  }

  _noteSkippedAndAppended() {
    const { skippedFlags, flags, vision, userArgs } = this._s;
    if (skippedFlags.length > 0) {
      this._notes.push(`Skipped ${skippedFlags.join(', ')}: ${flags.name} doesn't accept ${skippedFlags.length === 1 ? 'this flag' : 'these flags'} in this build. Inference still runs with the runtime's defaults.`);
    }
    if (vision.mmprojSuppressed) {
      this._notes.push(`Multimodal projector (--mmproj) suppressed: ${flags.name} can't safely process this model's vision encoder in its current build. Text inference works normally; image inputs would fail.`);
    }
    if (flags.extraArgs.length > 0) this._notes.push(`Runtime-specific args appended: ${flags.extraArgs.join(' ')}.`);
    if (userArgs.length > 0) {
      this._notes.push(`User flags appended: ${userArgs.join(' ')}. These come last, so they override any matching flag above.`);
    }
  }
}

module.exports = ModelFeatureNotes;
