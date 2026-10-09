const KvCacheModes = require('../../shared/llm/KvCacheModes');
const ByteLadder = require('../server/ByteLadder');
const DecodeFormula = require('../server/decode/DecodeFormula');

class RungTip {
  static for(rung) {
    const ctx = `${rung.tokens.toLocaleString()} ctx`;
    const kvText = RungTip._kvText(rung.kv);
    if (rung.source === 'fit') return RungTip._measured(rung, ctx, kvText);
    return RungTip._estimated(rung, ctx, kvText, rung.est || {});
  }

  static _measured({ state, tokensPerSec, vramBytes }, ctx, kvText) {
    if (state !== 'ok') {
      return `Measured: failed to load at ${ctx} (${kvText}). Re-run the fit test after changing runtime or hardware.`;
    }
    const bits = [];
    if (vramBytes) bits.push(`${ByteLadder.format(vramBytes)} VRAM`);
    if (tokensPerSec) bits.push(`${Number(tokensPerSec).toFixed(1)} tok/s`);
    return `Measured: loaded at ${ctx} (${kvText})${bits.length ? ': ' + bits.join(', ') : ''}.`;
  }

  static _estimated({ state, tokensPerSec, vramBytes }, ctx, kvText, est) {
    const predicted = RungTip._predicted(tokensPerSec);
    if (state === 'ok') {
      const room = est.usableVramBytes ? ` (${ByteLadder.format(est.usableVramBytes)} usable VRAM)` : '';
      const need = vramBytes ? `${ByteLadder.format(vramBytes)} needed` : 'fits';
      return `Estimated full GPU offload at ${ctx} (${kvText}): ${need}${room}.${predicted} Run the fit test to confirm.`;
    }
    if (state === 'partial') {
      const split = (est.ngl != null && est.layerCount)
        ? `: ${est.ngl}/${est.layerCount} layers on GPU, ${est.layerCount - est.ngl} on CPU` : '';
      return `Estimated partial offload at ${ctx} (${kvText})${split}. Mixed GPU/CPU, slower than a full offload.${predicted}`;
    }
    if (state === 'no') {
      const why = est.perLayerBytes
        ? `: not even one layer plus its KV cache (~${ByteLadder.format(est.perLayerBytes)}) fits the VRAM budget` : '';
      return `Estimated: won't fit on GPU at ${ctx} (${kvText})${why}. Runs CPU-bound.${predicted}`;
    }
    return `Can't estimate at ${ctx} (${kvText}): no usable runtime for this model on this host.`;
  }

  static _predicted(tokensPerSec) {
    if (!tokensPerSec) return '';
    const speed = DecodeFormula.describeTps(tokensPerSec).replace(/^about /, '~');
    return ` Predicted ${speed} at this depth without speculative decoding.`;
  }

  static _kvText(kv) {
    const mode = KvCacheModes.MODES.find((m) => m.id === kv);
    return mode ? mode.short : `${kv} KV`;
  }
}

module.exports = RungTip;
