export default class ContextOptionText {
  static CTX_LABEL = { 8192: '8k', 16384: '16k', 32768: '32k', 65536: '64k', 131072: '128k', 262144: '256k' };

  static ctxLabel(tokens) {
    return ContextOptionText.CTX_LABEL[Number(tokens)] || `${Math.round(Number(tokens) / 1024)}k`;
  }

  static chip(opt, selected) {
    const cls = ['cm-ctx-chip', opt.state, opt.source === 'fit' ? 'fit' : 'est'];
    if (selected) cls.push('sel');
    const { mark, tip } = ContextOptionText._markAndTip(opt);
    return { cls, text: opt.label + mark + ContextOptionText._speed(opt), tip };
  }

  static _markAndTip(opt) {
    const predicted = opt.tokensPerSecSource === 'predicted' && opt.tokensPerSec
      ? ` · predicted ~${Math.round(opt.tokensPerSec)} tok/s without speculative decoding` : '';
    const how = opt.source === 'fit' ? 'Measured' : 'Estimated';
    if (opt.source === 'fit' && opt.state === 'ok') {
      return { mark: '', tip: `Measured: fits${opt.tokensPerSec ? ` · ${opt.tokensPerSec} tok/s` : ''} (KV ${opt.kv})` };
    }
    if (opt.state === 'ok') return { mark: ' ~', tip: 'Estimated to fit on GPU (not yet fit-tested)' + predicted };
    if (opt.state === 'partial') return { mark: ' (partial)', tip: how + ': partial GPU offload, slower' + predicted };
    if (opt.state === 'no') return { mark: ' (CPU)', tip: how + ": won't fit GPU (CPU only, slow)" + predicted };
    return { mark: ' ?', tip: 'Can\'t estimate: no GPU/runtime info' };
  }

  static _speed(opt) {
    const tps = opt.tokensPerSec ? Math.round(opt.tokensPerSec) : 0;
    if (tps && opt.tokensPerSecSource === 'measured') return ` · ${tps}t/s`;
    if (tps && opt.tokensPerSecSource === 'predicted') return ` · ~${tps}t/s`;
    return '';
  }
}
