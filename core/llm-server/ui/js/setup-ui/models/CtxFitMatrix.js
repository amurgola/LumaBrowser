import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class CtxFitMatrix {
  static DEFAULT_KV_MODES = [
    { id: 'f16', short: 'f16 KV', help: 'Full-precision KV cache: 2 bytes per element' },
    { id: 'q8_0', short: 'q8 KV', help: 'Quantised KV cache (q8_0): roughly half the VRAM of f16' },
  ];

  static SUB_TIP = 'From the launch planner: the same decision Start makes. Rungs the fit test has measured show their recorded numbers; the rest are planner estimates with a predicted speed. Hover a pill for detail. Green = full GPU offload · Yellow = partial GPU/CPU split · Red = CPU-bound · Grey = can\'t estimate';

  static MTP_NOTE = ' <span class="model-ctxfit-mtp" title="MTP draft branch: extra weights, a draft KV cache, and ~256 MB scratch. The matrix includes this cost because the launcher engages MTP automatically for MTP-grafted GGUFs.">+ MTP overhead</span>';

  static html(model, opts) {
    if (model.kind !== 'weights') return '';
    const g = model.gguf;
    if (!g || !g.parsed || !g.blockCount) return '';
    const kvOptions = opts && opts.kvOptions;
    if (!kvOptions) return '';
    const modes = (Array.isArray(opts.kvModes) && opts.kvModes.length) ? opts.kvModes : CtxFitMatrix.DEFAULT_KV_MODES;
    return `
                <div class="model-ctxfit" role="group" aria-label="GPU fit by context (estimated)">
                    <div class="model-ctxfit-header">
                        <span class="model-ctxfit-title">GPU fit by context</span>
                        <span class="model-ctxfit-sub" title="${HtmlEscaper.escape(CtxFitMatrix.SUB_TIP)}">planner · hover for detail</span>
                        ${CtxFitMatrix.speedChip(opts.speed)}
                        ${model.mtpCapable ? CtxFitMatrix.MTP_NOTE : ''}
                    </div>
                    <div class="model-ctxfit-grid">
                        ${modes.map((m) => CtxFitMatrix._row(kvOptions[m.id] || [], m)).join('')}
                    </div>
                </div>
            `;
  }

  static speedChip(sp) {
    if (sp && sp.measured != null) return CtxFitMatrix._measuredChip(sp);
    if (sp && sp.predicted != null) {
      const n = Number(sp.predicted);
      return `<span class="model-ctxfit-speed" data-speed="predicted" title="Predicted from bytes per token over memory bandwidth at ${Number(sp.depth).toLocaleString()} ctx, without speculative decoding. Run the fit test to measure it.">~${n >= 10 ? Math.round(n) : n.toFixed(1)} tok/s predicted</span>`;
    }
    return '';
  }

  static _measuredChip(sp) {
    const esc = HtmlEscaper.escape;
    const d = sp.measuredAtDepth;
    const hasDepth = !!(d && d.tokensPerSec != null && d.tokens);
    const atDepth = hasDepth ? `, ${Number(d.tokensPerSec).toFixed(1)} at ${Math.round(Number(d.tokens) / 1024)}K` : '';
    const depthTip = hasDepth
      ? ` Behind ${Number(d.tokens).toLocaleString()} tokens of history: ${Number(d.tokensPerSec).toFixed(1)} tok/s${d.predicted != null ? ` (planner predicted ~${Math.round(Number(d.predicted))})` : ''}.`
      : '';
    return `<span class="model-ctxfit-speed" data-speed="measured" title="Measured by the fit test at ${Number(sp.depth).toLocaleString()} ctx (${esc(sp.kv || 'f16')} KV).${esc(depthTip)}">${Number(sp.measured).toFixed(1)} tok/s measured${esc(atDepth)}</span>`;
  }

  static _row(rungs, mode) {
    const esc = HtmlEscaper.escape;
    const pills = rungs.map((o) => {
      const cls = o.state === 'unknown' ? 'na' : o.state;
      return `<span class="ctx-pill ${esc(cls)}" data-source="${esc(o.source)}" title="${esc(o.tip || '')}">${esc(o.label)}</span>`;
    }).join('');
    return `
                    <div class="ctxfit-row" data-kv="${esc(mode.id)}">
                        <span class="ctxfit-row-label" title="${esc(mode.help)}">${esc(mode.short)}</span>
                        <div class="ctxfit-pills">${pills}</div>
                    </div>
                `;
  }
}
