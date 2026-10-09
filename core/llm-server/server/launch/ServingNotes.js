const path = require('path');
const ByteLadder = require('../ByteLadder');
const SlotPlan = require('./SlotPlan');
const PromptCacheRam = require('./PromptCacheRam');

class ServingNotes {
  static MIB = 1024 * 1024;

  static build(state) {
    return new ServingNotes(state).execute();
  }

  constructor(state) {
    this._s = state;
    this._notes = [];
    this._runtime = state.flags.name;
  }

  execute() {
    this._noteSlots();
    this._noteContextRetention();
    this._notePromptCache();
    this._noteTensorParallel();
    this._noteFamily();
    this._noteMeasuredBasis();
    this._noteDistributed();
    this._noteExpertOffload();
    this._noteLoadModeFallback();
    return this._notes;
  }

  _noteSlots() {
    const { slots, kv, flags } = this._s;
    if (slots.parallelEnabled) {
      this._notes.push(
        `Max concurrent predictions: ${slots.maxConcurrent} slots (--parallel). `
        + `The ${kv.contextSize}-token context is shared across slots, ~${Math.floor(kv.contextSize / slots.maxConcurrent)} tokens per request.`,
      );
    } else if (slots.requestedConcurrent > 1 && !flags.parallel) {
      this._notes.push(`Max concurrent predictions: requested ${slots.requestedConcurrent} but ${this._runtime} doesn't accept --parallel in this build; running with a single prediction slot.`);
    }
  }

  _noteContextRetention() {
    const { slots } = this._s;
    const chunk = SlotPlan.CACHE_REUSE_MIN_CHUNK;
    if (slots.cacheReuseEnabled) {
      this._notes.push(
        `Context retention: ON (--cache-reuse ${chunk}). `
        + `The server keeps each conversation's processed context in its KV cache and reuses matching chunks of ${chunk}+ tokens even after earlier history changes, so follow-up replies skip most prompt re-processing.`,
      );
    } else if (slots.cacheReuseRequested) {
      this._notes.push(`Context retention: requested but OFF, ${this._runtime} doesn't accept --cache-reuse in this build. Exact-prefix prompt caching still applies.`);
    }
  }

  _notePromptCache() {
    const { loading } = this._s;
    const cache = loading.promptCacheRam;
    if (cache.mib != null && cache.mib > 0) {
      this._notes.push(
        `Prompt cache in RAM: ${ByteLadder.format(cache.mib * ServingNotes.MIB)} (--cache-ram ${cache.mib}${cache.source === 'user' ? ', your setting' : ''}). `
        + 'Context evicted from a slot is parked in system RAM and restored when a prompt with the same prefix returns, so switching between conversations skips most prompt re-processing.'
        + (loading.slotSimilarityEnabled ? ` Requests are routed to the slot whose cached prefix matches best (--slot-prompt-similarity ${PromptCacheRam.SLOT_PROMPT_SIMILARITY}).` : ''),
      );
    } else if (cache.mib === 0) {
      const why = cache.source === 'off' ? ', by your setting' : cache.reason ? `: ${cache.reason}` : '';
      this._notes.push(`Prompt cache in RAM: OFF (--cache-ram 0)${why}. Each slot still keeps its own context while it is loaded.`);
    } else if (cache.source === 'unsupported') {
      this._notes.push(`Prompt cache in RAM: ${this._runtime} doesn't accept --cache-ram in this build; the server's own behaviour stands.`);
    }
  }

  _noteTensorParallel() {
    const { splits, tensorGate, offload } = this._s;
    if (splits.emitTensorSplit) {
      this._notes.push(
        `Tensor-parallel split: ON (--split-mode tensor${splits.tensorSplitRatio ? `, --tensor-split ${splits.tensorSplitRatio}` : ''}). `
        + 'Both cards work the same tensors: faster decode on a fast/slow pairing, but SLOWER prompt processing. '
        + 'KV cache forced to f16 (required by -sm tensor). Experimental: known CUDA-graph VRAM leak under load.',
      );
    } else if (tensorGate.requested && !tensorGate.staticOk) {
      this._notes.push(`Tensor-parallel split: requested but OFF: ${tensorGate.whyOff}.`);
    } else if (tensorGate.staticOk && !offload.fullOffload) {
      this._notes.push('Tensor-parallel split: requested but OFF: the model doesn\'t fully fit in VRAM (tensor split requires full offload); using the layer split.');
    }
  }

  _noteFamily() {
    const { kv, family } = this._s;
    const profile = family.tuning.profile;
    if (kv.kvQuantForcedF16) {
      this._notes.push(`KV cache: forced to f16; a quantized KV cache is known to corrupt ${profile ? profile.label : 'this model'}'s output, so the requested precision was not applied.`);
    }
    if (profile) this._noteFamilyTuning(profile, family.tuning);
    this._noteFamilyDrafter(profile);
  }

  _noteFamilyTuning(profile, tuning) {
    const skipped = tuning.skipped.length
      ? ` Skipped on this runtime: ${tuning.skipped.join(' ')} (${this._runtime} doesn't accept ${tuning.skipped.length === 1 ? 'it' : 'them'}).`
      : '';
    this._notes.push(
      `${profile.label} tuning: ON (${tuning.args.filter((a) => a.startsWith('--')).join(' ')}). `
      + `${profile.note}${skipped}`
      + ' The sampler is applied as the server default AND by the chat request builder, so it holds for every turn.',
    );
  }

  _noteFamilyDrafter(profile) {
    const { family, files, spec, flags, offload } = this._s;
    const drafter = family.drafterSpec;
    if (drafter) {
      this._notes.push(
        `${drafter.label} speculative decoding: ON (--spec-type ${drafter.specType}, `
        + `--spec-draft-n-max ${drafter.draftNMax}, -md ${path.basename(files.drafterPath)}`
        + `${offload.ngl > 0 ? ', -ngld 99' : ''}). The drafter proposes a whole block per step and the main model `
        + 'verifies it in parallel: same output, large decode speedup. '
        + `${ByteLadder.format(files.drafterBytes)} of drafter weights plus its draft KV are reserved in the VRAM budget.`,
      );
    } else if (files.drafterPath && spec.specDrafterOff) {
      this._notes.push(`Speculative decoding: OFF by setting; a ${path.basename(files.drafterPath)} drafter is present and would be used otherwise.`);
    } else if (files.drafterPath && !flags.specDrafterFlags) {
      this._notes.push(`Speculative decoding: a drafter (${path.basename(files.drafterPath)}) is present but ${this._runtime} doesn't accept the --spec-type / -md flags in this build.`);
    } else if (files.family && profile && profile.speculative && !files.drafterPath) {
      this._notes.push(
        `Speculative decoding: OFF: ${profile.label} ships a ${profile.speculative.label} drafter `
        + 'as a separate GGUF, and none was found next to the weights. Download it into the same folder to enable it.',
      );
    }
  }

  _noteMeasuredBasis() {
    const { offload, kv } = this._s;
    if (offload.measuredVramBytes == null) return;
    this._notes.push(
      `VRAM basis: MEASURED ${ByteLadder.format(offload.measuredVramBytes)} from a prior fit test for this `
      + `${kv.contextSize}-token / ${kv.cacheTypeK === 'q8_0' || kv.cacheTypeV === 'q8_0' ? 'q8' : 'f16'} KV combo `
      + `(header estimate was ${ByteLadder.format(offload.headerEstimatedBytes)}), used for the fit + placement decision.`,
    );
  }

  _noteDistributed() {
    const { budget, overrides } = this._s;
    if (budget.rpcEnabled) {
      this._noteRpcOn();
    } else if (budget.rpcServers.length && !budget.rpcFlagSupported) {
      this._notes.push(`Distributed inference: requested but OFF, ${this._runtime} doesn't accept --rpc in this build.`);
    } else if (overrides.rpcSkippedFitsLocal) {
      this._notes.push('Distributed inference: available but not used: the model fully fits local VRAM, and the LAN link would only slow it down (peer GPUs are borrowed only when the model cannot fit locally).');
    } else if (overrides.rpcSkippedMoeOffload) {
      this._notes.push(
        'Distributed inference: available but not used: even with the peer GPUs the expert tensors would ride in system RAM, '
        + 'and extra LAN pipeline stages only slow that mode down. Running local expert-offload instead.',
      );
    }
  }

  _noteRpcOn() {
    const { budget, splits } = this._s;
    const who = budget.rpcServers.map((s) => `${s.label || 'peer'} at ${s.addr}`).join(', ');
    const ratio = splits.rpcSplitRatio;
    const split = ratio
      ? `Layers split by explicit --tensor-split ${ratio} (MiB of usable VRAM per device, remote first); the rpc-server's own free-memory report is unreliable, so the split is built from the peer's acquire-time probe instead. ${this._idleRemoteNote(ratio)}`
      : 'Layers split across local and remote devices by llama.cpp\'s free-memory default (the peer didn\'t report per-device VRAM; update it for an explicit split). ';
    this._notes.push(
      `Distributed inference: ON (--rpc). Borrowing GPUs from ${who}. ${split}`
      + 'The first load streams the weights over the LAN (the peer caches them for later runs), and traffic is unencrypted, so use trusted networks only.',
    );
  }

  _idleRemoteNote(ratio) {
    const remoteCount = this._s.budget.rpcServers.reduce((s, r) => s + (Array.isArray(r.devices) ? r.devices.length : 0), 0);
    const idle = ratio.split(',').slice(0, remoteCount).filter((p) => p === '0').length;
    if (idle <= 0) return '';
    return `${idle} remote GPU${idle === 1 ? '' : 's'} left idle: the model doesn't need the capacity, and every extra pipeline stage costs generation speed. `;
  }

  _noteExpertOffload() {
    const { moe } = this._s;
    if (moe.cpuMoeEnabled && moe.gpuExpertLayers > 0) this._noteExpertFill();
    else if (moe.cpuMoeEnabled) this._noteAllExpertsInRam();
    else if (moe.cpuMoeRequested && !moe.cpuMoeFlagSupported) this._notes.push(`MoE expert offload: requested but OFF: ${this._runtime} doesn't accept --cpu-moe in this build.`);
    else if (moe.cpuMoeRequested && !moe.moeSplit) this._notes.push('MoE expert offload: requested but OFF: this model has no expert tensors (not MoE) or its header could not be read.');
    else if (moe.cpuMoeRequested) this._notes.push('MoE expert offload: requested but not needed: every expert tensor fits in VRAM, so the model runs as a plain full offload.');
  }

  _noteExpertFill() {
    const { moe, files, loading, budget } = this._s;
    const fmt = ByteLadder.format;
    const blocks = files.gguf.blockCount;
    this._notes.push(
      `MoE expert offload: ${moe.cpuMoeAuto ? 'AUTO' : 'ON'} (--n-cpu-moe ${moe.nCpuMoe}). Expert tensors of ${moe.nCpuMoe}/${blocks} layers `
      + `(~${fmt(moe.cpuExpertBytes)})${moe.moeHostBytes > 0 ? ` plus ~${fmt(moe.moeHostBytes)} of CPU-side input embeddings` : ''} stay in system RAM; `
      + `the other ${moe.gpuExpertLayers} layers' experts (~${fmt(moe.expertBytesRange(moe.nCpuMoe, blocks))}), `
      + `all attention/norms/shared experts (~${fmt(moe.moeSplit.residentBytes)}), and the KV cache fill the GPUs`
      + `${moe.tensorSplitRatio ? ` (byte-balanced --tensor-split ${moe.tensorSplitRatio})` : ''}. `
      + `Sizing basis: ${moe.moeExact ? 'per-tensor scan of the weights (exact per-layer bytes)' : 'header ratio estimate (even per-layer spread, wider safety margin)'}. `
      + (moe.cpuMoeAuto ? `Engaged automatically: the full ${fmt(files.modelBytes)} of weights exceeds the ${fmt(budget.vramAvailableBytes)} VRAM budget, and experts-in-RAM decodes far faster than spilling whole layers to the CPU. ` : '')
      + (loading.moeNeedsMmap
        ? 'The expert pool exceeds the comfortable RAM budget, so weights load memory-mapped: cold experts fault in from disk and the OS may evict them under pressure.'
        : 'The expert pool is bulk-read into RAM at load (longer start, then full RAM-speed decode from the first token).'),
    );
  }

  _noteAllExpertsInRam() {
    const { moe, files } = this._s;
    const fmt = ByteLadder.format;
    this._notes.push(
      `MoE expert offload: ${moe.cpuMoeAuto ? 'AUTO' : 'ON'} (--cpu-moe). Expert tensors (~${fmt(moe.moeSplit.expertBytes)}) stay in system RAM; `
      + `attention/embeddings (~${fmt(moe.moeSplit.residentBytes)}) plus the KV cache run on the GPU. `
      + `The VRAM budget was sized against the resident share, not the full ${fmt(files.modelBytes)} file.`,
    );
  }

  _noteLoadModeFallback() {
    const { loading } = this._s;
    if (loading.useMmap || loading.loadModeFlag) return;
    this._notes.push(`Model loading: ${this._runtime} rejects both --load-mode and --no-mmap in this build, so the weights load memory-mapped (the binary's default) instead of the faster bulk read.`);
  }
}

module.exports = ServingNotes;
