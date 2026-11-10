import ContextOptionText from './ContextOptionText.js';
import ChatIcons from '../ChatIcons.js';
import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class LocalModelRows {
  constructor(picker, ctx) {
    this._picker = picker;
    this._ctx = ctx;
  }

  render(pop) {
    const { state } = this._ctx;
    if (!state.localModels.length) return;
    pop.appendChild(Dom.el('div', 'cm-model-group', 'Local'));
    for (const m of state.localModels) {
      const block = Dom.el('div', 'cm-local-block');
      block.appendChild(this._row(m));
      const profiles = this._picker.profilesOf(m.ref);
      if (profiles.length) block.appendChild(this._picker.profileList(profiles));
      pop.appendChild(block);
    }
  }

  static selectedRow(pop) {
    return pop.querySelector('.cm-local-row.sel, .cm-profile-opt.sel');
  }

  _row(m) {
    const esc = HtmlEscaper.escape;
    const sel = m.ref === this._ctx.state.modelRef;
    const row = Dom.el('div', 'cm-model-opt cm-local-row' + (sel ? ' sel' : ''),
      '<div class="cm-local-text"><div class="cm-local-name">' + esc(m.displayName || m.name) + '</div>'
      + '<div class="cm-model-sub">' + esc(m.summary)
      + (m.hasFit ? '' : ' · <span class="cm-est-tag">estimated</span>') + '</div></div>');
    row.title = sel ? 'In use' : 'Use ' + (m.displayName || m.name);
    row.addEventListener('click', () => this._picker.selectLocal(m, this._picker.chosenCtx(m)));
    if (sel) row.appendChild(Dom.el('span', 'cm-inuse', 'In use'));
    if ((m.contextOptions || []).length) row.appendChild(this._ctxToggle(m, row));
    this._picker.addTuneButton(row, m.ref, m.displayName || m.name);
    return row;
  }

  _ctxToggle(m, row) {
    const t = this._picker.chosenCtx(m);
    const btn = Dom.el('button', 'cm-ctx-toggle',
      '<span>' + HtmlEscaper.escape(t ? ContextOptionText.ctxLabel(t) : 'Context') + '</span><span class="cm-caret">' + ChatIcons.chevron + '</span>');
    btn.type = 'button';
    btn.title = 'Context length for ' + (m.displayName || m.name);
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._togglePanel(m, row, btn);
    });
    return btn;
  }

  _togglePanel(m, row, btn) {
    const block = row.parentElement;
    const open = block.querySelector('.cm-ctx-panel');
    const pop = block.parentElement;
    if (pop) {
      pop.querySelectorAll('.cm-ctx-panel').forEach((p) => p.remove());
      pop.querySelectorAll('.cm-ctx-toggle[aria-expanded="true"]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
    }
    if (open) return;
    const panel = Dom.el('div', 'cm-ctx-panel');
    for (const opt of m.contextOptions) panel.appendChild(this._chip(m, opt));
    row.after(panel);
    btn.setAttribute('aria-expanded', 'true');
    if (typeof panel.scrollIntoView === 'function') panel.scrollIntoView({ block: 'nearest' });
  }

  _chip(m, opt) {
    const spec = ContextOptionText.compact(opt, this._picker.chosenCtx(m) === opt.tokens);
    const chip = Dom.el('button', spec.cls.join(' '),
      '<span class="cm-ctx-k">' + HtmlEscaper.escape(spec.label) + '</span>'
      + (spec.note ? '<span class="cm-ctx-note">' + HtmlEscaper.escape(spec.note) + '</span>' : ''));
    chip.type = 'button';
    chip.title = spec.tip;
    chip.addEventListener('click', (e) => { e.stopPropagation(); this._picker.pickContext(m, opt.tokens); });
    return chip;
  }
}
