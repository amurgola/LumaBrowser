import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class GambitView {
  static GROUP_LABELS = {
    instruction: 'Instruction following',
    conversation: 'Conversation memory',
    web: 'Web navigation and tools',
    answer: 'Correct answer',
    artifacts: 'Artifacts',
    validation: 'Code validation',
    execution: 'Code execution',
    health: 'Health',
  };

  static INTRO = 'Grades the model above on the job it actually does: following instructions, holding a conversation, driving the browser, picking the right tool, answering correctly, building a working artifact, and finishing a turn without looping. Takes 30 to 60 minutes and starts the server if it is not already up.';

  constructor(state, fitBusy) {
    this._state = state;
    this._fitBusy = fitBusy;
  }

  static bandClass(band) {
    if (band === 'good') return 'ok';
    return band === 'usable' ? 'accent' : 'bad';
  }

  static scoreClass(score) {
    if (score >= 0.9) return 'ok';
    return score >= 0.7 ? 'accent' : 'bad';
  }

  blockHtml(path) {
    return `<div class="model-gambit" id="gambitBlock">${this.contentHtml(path)}</div>`;
  }

  summaryHtml(path) {
    const st = path ? this._state.get(path) : null;
    if (path && this._state.isRunning(path)) {
      return `<span class="fold-chip">running ${st ? st.done : 0}/${(st && st.total) || '?'}</span>`;
    }
    if (st && st.report) {
      const rep = st.report;
      return `<span class="luma-badge ${GambitView.bandClass(rep.band)}">${Math.round(rep.overall * 100)}%</span>`
        + `<span class="fold-chip">${HtmlEscaper.escape(rep.band || '')}</span>`;
    }
    return '<span class="fold-chip">not run yet</span>';
  }

  contentHtml(path) {
    if (!path) return '<div class="fit-note">Pick a default model above to run the compatibility gambit.</div>';
    const st = this._state.get(path);
    const parts = [this._state.isRunning(path) ? GambitView._progressHtml(st) : this._controlHtml(path, st)];
    if (st && st.error) parts.push(`<div class="fit-note bad">${HtmlEscaper.escape(st.error)}</div>`);
    if (st && st.report) parts.push(GambitView._reportHtml(st), GambitView._coverageHtml(st), GambitView._rawHtml(path, st));
    return parts.join('');
  }

  static _progressHtml(st) {
    const pct = st && st.total ? Math.round((st.done / st.total) * 100) : 0;
    const where = st && st.taskId ? `${st.group || ''} · ${st.taskId}` : 'warming up';
    return `
                    <div class="fit-progress">
                        <button class="luma-btn luma-btn--sm danger" data-gam-cancel>Cancel</button>
                        <div class="luma-progress"><div class="luma-progress-fill" style="width:${pct}%"></div></div>
                        <span>${st ? st.done : 0}/${(st && st.total) || '?'} · ${HtmlEscaper.escape(where)}</span>
                    </div>`;
  }

  _controlHtml(path, st) {
    const hasReport = !!(st && st.report);
    const dis = this._fitBusy() ? 'disabled title="A fit test is running"' : '';
    const button = `<button class="luma-btn luma-btn--sm" data-gam-test data-gam-path="${HtmlEscaper.escape(path)}" ${dis}>${hasReport ? 'Re-run gambit' : 'Run compatibility gambit'}</button>`;
    return hasReport ? button : button + `<div class="fit-note">${GambitView.INTRO}</div>`;
  }

  static _reportHtml(st) {
    const esc = HtmlEscaper.escape;
    const rep = st.report;
    const pct = (x) => Math.round(x * 100);
    const rows = (rep.groups || []).map((g) => `<tr>
                        <td>${esc(GambitView.GROUP_LABELS[g.key] || g.label || g.key)}</td>
                        <td class="fit-metric"><span class="luma-badge ${GambitView.scoreClass(g.score)}">${pct(g.score)}%</span></td>
                        <td class="fit-metric">${g.derived ? esc(g.detail || '') : `${g.passed}/${g.n} passed`}</td>
                    </tr>`).join('');
    return `
                    <div class="gambit-headline">
                        <span class="luma-badge ${GambitView.bandClass(rep.band)} gambit-score">${pct(rep.overall)}%</span>
                        <span class="gambit-band">${esc(rep.band || '')}</span>
                        <span class="sub">worst decile ${pct(rep.worstDecile || 0)}%</span>
                    </div>
                    <table class="luma-table gambit-table">
                        <thead><tr><th>Capability</th><th>Score</th><th>Detail</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>`;
  }

  static _coverageHtml(st) {
    const c = st.report.coverage || { ran: 0, total: 0, skipped: 0 };
    let cov = `${c.ran} of ${c.total} tasks ran`;
    if (c.skipped) {
      const why = Object.keys(c.reasons || {}).join('; ');
      cov += `, ${c.skipped} skipped${why ? ' (' + HtmlEscaper.escape(why) + ')' : ''}`;
    }
    if (st.ranAt) {
      const d = new Date(st.ranAt);
      if (!isNaN(d)) cov += ' · ' + d.toLocaleString();
    }
    return `<div class="fit-note">${cov}</div>`;
  }

  static _rawHtml(path, st) {
    if (st.hasRaw) return `<button class="luma-btn luma-btn--sm" data-gam-download data-gam-path="${HtmlEscaper.escape(path)}">Download raw results</button>`;
    return '<div class="fit-note">Raw transcripts are kept for the most recent run in this session only. Re-run to download them.</div>';
  }
}
