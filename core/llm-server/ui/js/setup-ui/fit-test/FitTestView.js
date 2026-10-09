import ByteFormatter from '../../format/ByteFormatter.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';
import CtxLadder from '../models/CtxLadder.js';

export default class FitTestView {
  static KV_COLUMN_LABELS = { f16: 'KV f16 · full precision', q8_0: 'KV q8_0 · fp8', q8q4: 'KV q8/q4 · asymmetric' };

  static CHAT_SERVER_NOTES = {
    stopping: 'Your chat server was stopped for the test.',
    restarting: 'Restarting your chat server…',
    restarted: 'Chat server restarted.',
  };

  static VRAM_TIPS = {
    missing: 'VRAM not measured: nvidia-smi unavailable on this host.',
    approx: 'Whole-card free-VRAM drop while loaded (per-process VRAM reads as N/A on GeForce/WDDM, so this is the reliable signal: the test runs one model at a time on an otherwise-idle card).',
    exact: 'Exact per-process GPU memory.',
  };

  static RAM_TIP = 'Process working set. Includes the memory-mapped GGUF, which the OS counts even when the weights are fully offloaded to VRAM: so RAM ≈ model size is normal on a full GPU offload.';

  constructor(state, defaults) {
    this._state = state;
    this._defaults = defaults;
  }

  static key(path) {
    let h = 0;
    for (let i = 0; i < path.length; i++) h = ((h << 5) - h + path.charCodeAt(i)) | 0;
    return 'k' + (h >>> 0).toString(36);
  }

  blockHtml(path) {
    if (!path) return '';
    return `<div class="model-fittest" id="fit-${FitTestView.key(path)}" data-fit-path="${HtmlEscaper.escape(path)}">${this.contentHtml(path)}</div>`;
  }

  contentHtml(path) {
    const st = this._state.get(path);
    const running = this._state.isRunning(path);
    const parts = [running ? FitTestView._progressHtml(st) : this._buttonHtml(path, st)];
    parts.push(FitTestView._notesHtml(st, running));
    if (st && st.results && st.results.length) parts.push(this.tableHtml(path, st), FitTestView._hardwareHtml(st));
    return parts.join('');
  }

  tableHtml(path, st) {
    const byCtx = FitTestView._byContext(st.results);
    const kvIds = FitTestView._kvIds(st.results);
    const rows = [...byCtx.keys()].sort((a, b) => a - b).map((c) => {
      const cells = kvIds.map((id) => this._cell(byCtx.get(c)[id], path)).join('');
      return `<tr><td class="ctxcell">${HtmlEscaper.escape(CtxLadder.label(c))}</td>${cells}</tr>`;
    }).join('');
    return `
                <table class="luma-table">
                    <thead>
                        <tr>
                            <th rowspan="2">Context</th>
                            ${kvIds.map((id) => `<th class="grp" colspan="4">${HtmlEscaper.escape(FitTestView.KV_COLUMN_LABELS[id] || ('KV ' + id))}</th>`).join('')}
                        </tr>
                        <tr>
                            ${kvIds.map(() => '<th class="grp">VRAM</th><th>RAM</th><th>tok/s</th><th></th>').join('')}
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>`;
  }

  static _progressHtml(st) {
    const total = st && st.total ? st.total : 0;
    const idx = st && st.index ? st.index : 0;
    const pct = total ? Math.round((idx / total) * 100) : 0;
    const comboTxt = st && st.combo ? `${CtxLadder.label(st.combo.contextTokens)} · KV ${st.combo.kv}` : 'warming up…';
    return `
                    <div class="fit-progress">
                        <button class="luma-btn luma-btn--sm danger" data-fit-cancel>Cancel</button>
                        <div class="luma-progress"><div class="luma-progress-fill" style="width:${pct}%"></div></div>
                        <span>${idx}/${total || '?'} · ${HtmlEscaper.escape(comboTxt)}</span>
                    </div>`;
  }

  _buttonHtml(path, st) {
    const hasResults = !!(st && st.results && st.results.length);
    const cls = hasResults ? 'luma-btn luma-btn--sm' : 'luma-btn primary luma-btn--sm';
    const dis = this._state.busy && this._state.routePath !== path ? 'disabled title="Another fit test is running"' : '';
    return `<button class="${cls}" data-fit-test data-fit-path="${HtmlEscaper.escape(path)}" ${dis}>${hasResults ? 'Re-run fit test' : 'Run fit test'}</button>`;
  }

  static _notesHtml(st, running) {
    if (!st) return '';
    const esc = HtmlEscaper.escape;
    const parts = [];
    const note = FitTestView._chatServerNote(st.chatServer);
    if (note) parts.push(`<div class="fit-note ${st.chatServer.state === 'restore-failed' ? 'bad' : ''}">${esc(note)}</div>`);
    if (st.error) parts.push(`<div class="fit-note bad">${esc(st.error)}</div>`);
    if (st.runtime && (running || (st.results && st.results.length))) {
      parts.push(`<div class="fit-note">Measured with ${esc(st.runtime.name)} · flash attention forced on.</div>`);
    }
    return parts.join('');
  }

  static _chatServerNote(cs) {
    if (!cs || !cs.state) return null;
    if (cs.state === 'restore-failed') return 'Chat server restore failed' + (cs.error ? ': ' + cs.error : '') + '.';
    return FitTestView.CHAT_SERVER_NOTES[cs.state] || null;
  }

  static _hardwareHtml(st) {
    if (!st.hardware) return '';
    let when = '';
    if (st.ranAt) {
      const d = new Date(st.ranAt);
      if (!isNaN(d)) when = ' · ' + d.toLocaleString();
    }
    return `<div class="fit-note fit-hw">Measured on ${HtmlEscaper.escape(st.hardware)}${HtmlEscaper.escape(when)}</div>`;
  }

  static _byContext(results) {
    const byCtx = new Map();
    for (const r of results) {
      if (!byCtx.has(r.contextTokens)) byCtx.set(r.contextTokens, {});
      byCtx.get(r.contextTokens)[r.kv] = r;
    }
    return byCtx;
  }

  static _kvIds(results) {
    const ids = [];
    for (const r of results) if (!ids.includes(r.kv)) ids.push(r.kv);
    return ids;
  }

  _cell(r, path) {
    if (!r) return '<td class="grp">…</td><td>…</td><td>…</td><td></td>';
    if (r.status !== 'ok') return FitTestView._failedCell(r);
    const fmt = ByteFormatter.bytes;
    const esc = HtmlEscaper.escape;
    const vramTxt = r.vramBytes != null ? (r.vramApprox ? '≈' : '') + fmt(r.vramBytes) : 'n/a';
    const ram = r.ramBytes != null ? `<span title="${esc(FitTestView.RAM_TIP)}">${fmt(r.ramBytes)}</span>` : 'n/a';
    const tok = r.tokensPerSec != null ? r.tokensPerSec.toFixed(1) + ' t/s' : 'n/a';
    const sub = r.fullOffload === false && r.ngl != null ? `<span class="sub" title="partial offload"> ·${r.ngl}L</span>` : '';
    return `<td class="grp fit-metric"><span title="${esc(FitTestView._vramTip(r))}">${vramTxt}</span>${sub}</td>`
      + `<td class="fit-metric">${ram}</td>`
      + `<td class="fit-metric">${tok}</td>`
      + `<td>${this._useButton(r, path)}</td>`;
  }

  static _failedCell(r) {
    const tip = HtmlEscaper.escape((r.error || 'failed') + (r.logsTail ? '\n\n' + r.logsTail : ''));
    const word = r.status === 'skipped' ? 'skipped' : 'failed';
    return `<td class="grp fit-fail" colspan="3" title="${tip}">${word}${r.ngl != null ? ` (ngl ${r.ngl})` : ''}</td><td></td>`;
  }

  static _vramTip(r) {
    if (r.vramBytes == null) return FitTestView.VRAM_TIPS.missing;
    return r.vramApprox ? FitTestView.VRAM_TIPS.approx : FitTestView.VRAM_TIPS.exact;
  }

  _useButton(r, path) {
    const esc = HtmlEscaper.escape;
    const d = this._defaults();
    const active = !!(d && d.modelPath === path && Number(d.contextSize) === r.contextTokens && (d.kvCacheType || 'f16') === r.kv);
    return `<button class="fit-use ${active ? 'active' : ''}" data-fit-use data-fit-path="${esc(path)}" data-fit-ctx="${r.contextTokens}" data-fit-kv="${esc(r.kv)}" title="Pin this model + ${esc(CtxLadder.label(r.contextTokens))} ctx + KV ${esc(r.kv)} as the Start defaults">${active ? 'in use' : 'Use'}</button>`;
  }
}
