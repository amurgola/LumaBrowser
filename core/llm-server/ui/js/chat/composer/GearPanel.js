import ChatIcons from '../ChatIcons.js';
import PopoverFit from '../common/PopoverFit.js';
import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class GearPanel {
  static MIN_PANEL = 350;

  constructor(ctx) {
    this._ctx = ctx;
    this._onDocClick = (e) => this._docClick(e);
    this._onResize = () => this.fit();
  }

  toggle(btn) {
    const existing = this._ctx.root.querySelector('.cm-gear-pop');
    this._ctx.popovers.closeAll();
    if (existing) { this.close(); return; }
    this.open(btn);
  }

  close() {
    if (this._ctx.root) this._ctx.root.querySelectorAll('.cm-gear-pop').forEach((e) => e.remove());
    document.removeEventListener('click', this._onDocClick);
    window.removeEventListener('resize', this._onResize);
  }

  open(btn) {
    const composer = btn.closest('.cm-composer');
    if (!composer) return;
    this._ctx.tabs.close();
    const pop = Dom.el('div', 'cm-gear-pop');
    this._appendAttach(pop);
    this._appendModel(pop);
    this._appendPlanLine(pop);
    this._appendChoices(pop);
    this._appendBrowser(pop);
    this._appendTools(pop);
    composer.appendChild(pop);
    this.fit();
    window.addEventListener('resize', this._onResize);
    setTimeout(() => document.addEventListener('click', this._onDocClick), 0);
  }

  fit() {
    const pop = this._ctx.root && this._ctx.root.querySelector('.cm-gear-pop');
    if (!pop) return;
    PopoverFit.fitShrinkingChild(pop, pop.querySelector('.cm-gear-tools'), this._ctx.root, GearPanel.MIN_PANEL);
  }

  _docClick(e) {
    const pop = this._ctx.root && this._ctx.root.querySelector('.cm-gear-pop');
    if (!pop) { document.removeEventListener('click', this._onDocClick); return; }
    if (pop.contains(e.target)) return;
    if (e.target.closest && e.target.closest('.cm-gear')) return;
    this.close();
  }

  _appendAttach(pop) {
    const api = this._ctx.api;
    if (!api.pickChatAttachment) return;
    const att = Dom.el('button', 'cm-gear-row', '<span class="cm-gear-ic">' + ChatIcons.paperclip + '</span><span>Attach a file…</span>');
    att.type = 'button';
    att.title = 'Attach a file (text, code, image)';
    att.addEventListener('click', async () => {
      att.disabled = true;
      try {
        const r = await api.pickChatAttachment();
        if (r && r.success && Array.isArray(r.files)) {
          this._ctx.attachments.add(r.files);
          this.close();
        }
      } catch (_) {} finally { att.disabled = false; }
    });
    pop.appendChild(att);
  }

  _appendModel(pop) {
    pop.appendChild(Dom.el('div', 'cm-gear-sec', 'Model'));
    const pill = Dom.el('button', 'cm-gear-row cm-model-pill',
      '<b>' + HtmlEscaper.escape(this._ctx.models.currentLabel()) + '</b><span class="cm-caret">' + ChatIcons.chevron + '</span>');
    pill.type = 'button';
    pill.addEventListener('click', (e) => { e.stopPropagation(); this._ctx.models.openPicker(pill, true); });
    pop.appendChild(pill);
  }

  _appendPlanLine(pop) {
    const api = this._ctx.api;
    if (!api.getServerStatus) return;
    const line = Dom.el('div', 'cm-plan-line', '');
    line.style.display = 'none';
    pop.appendChild(line);
    api.getServerStatus().then((st) => GearPanel.fillPlanLine(line, st)).catch(() => {});
  }

  static fillPlanLine(line, st) {
    const plan = st && st.plan;
    if (!plan || (st.state !== 'ready' && st.state !== 'starting')) return;
    const notes = Array.isArray(plan.notes) ? plan.notes : [];
    const decision = String(notes.find((n) => String(n).indexOf('Decision:') === 0) || '').replace(/^Decision:\s*/, '');
    const short = decision.split(GearPanel.CLAUSE_SPLIT)[0].replace(/\.$/, '').trim();
    if (!short) return;
    const ctx = Number(plan.contextSize);
    line.textContent = (st.state === 'starting' ? 'Starting: ' : 'Running: ')
      + short + (ctx > 0 ? ' · ' + ctx.toLocaleString() + ' ctx' : '');
    line.title = decision + '\nFull explanation: LLM tab > Setup > "How your model is running".';
    line.style.display = '';
  }

  static CLAUSE_SPLIT = new RegExp('\\.\\s|' + String.fromCharCode(0x2014));

  _appendChoices(pop) {
    const { api, state } = this._ctx;
    if (!(api.conv && api.conv.setChoices)) return;
    pop.appendChild(Dom.el('div', 'cm-gear-sec', 'Replies <span class="cm-gear-sub">for this chat</span>'));
    const row = GearPanel._checkboxRow('cm-gear-tool cm-gear-choices',
      'After each answer, offer three tappable reply choices. You can always type your own instead.',
      'Suggest reply choices', state.choicesEnabled !== false, (checked) => {
        state.choicesEnabled = checked;
        this._persistChoices();
      });
    pop.appendChild(row);
  }

  _appendBrowser(pop) {
    const { api, state } = this._ctx;
    if (!(api.tabPreview && api.tabPreview.setEnabled)) return;
    pop.appendChild(Dom.el('div', 'cm-gear-sec', 'Browser'));
    pop.appendChild(GearPanel._checkboxRow('cm-gear-tool',
      'Show the page the agent is working on, live, inside its tool card. Off still lets it browse, you just don\'t watch.',
      'Watch the browser tab live', state.tabPreviewEnabled !== false, (checked) => {
        state.tabPreviewEnabled = checked;
        try { api.tabPreview.setEnabled(checked); } catch (_) {}
      }));
  }

  _appendTools(pop) {
    const api = this._ctx.api;
    if (!(api.chat && api.chat.agentTools)) return;
    pop.appendChild(Dom.el('div', 'cm-gear-sec', 'Tools <span class="cm-gear-sub">for this chat</span>'));
    const toolsWrap = Dom.el('div', 'cm-gear-tools');
    pop.appendChild(toolsWrap);
    this._ctx.gearTools.render(toolsWrap);
  }

  static _checkboxRow(cls, title, label, checked, onChange) {
    const row = Dom.el('label', cls);
    row.title = title;
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = checked;
    cb.addEventListener('change', () => onChange(cb.checked));
    row.appendChild(cb);
    row.appendChild(Dom.el('span', null, label));
    return row;
  }

  _persistChoices() {
    const { api, state } = this._ctx;
    if (state.activeId && api.conv && api.conv.setChoices) {
      try { api.conv.setChoices(state.activeId, state.choicesEnabled !== false); } catch (_) {}
    }
  }
}
