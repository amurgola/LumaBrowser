import WidgetDom from '../widgets/WidgetDom.js';
import HubSection from './HubSection.js';

export default class ContextsSection extends HubSection {
  static PALETTE = ['#60a5fa', '#a78bfa', '#34d399', '#f472b6', '#22d3ee', '#facc15', '#fb923c', '#94a3b8'];
  static TYPED = {
    domain: { label: 'Domains', placeholder: 'acme.com, acme.atlassian.net', help: 'Mail from these domains and notifications from these sites' },
    url: { label: 'Link contains', placeholder: 'T024BE7LD, /client/acme', help: 'A workspace or team id that shows in the address of its tab' },
    app: { label: 'Whole apps', placeholder: 'messages, whatsapp', help: 'Everything from an app (slack, teams, gmail, outlook, messages, clickup, ...)' },
  };

  constructor(tab) {
    super(tab);
    this._contexts = [];
    this._choices = { tabs: [], calendars: [], trackers: [] };
  }

  html() {
    return `
    <h4 class="luma-section-label">Contexts</h4>
    <div class="luma-field-help">Name the companies or areas you work across, and say what belongs to each. Activity, summaries and the focus view are grouped by these instead of by app. Anything that matches no context lands in Other. When two rules could apply, a link match wins, then the tab, then the domain, then the app.</div>
    <div class="ext-mt-8" id="ext-hub-ctxList"></div>
    <div class="luma-form-actions ext-form-buttons--start ext-mt-8">
      <button class="luma-btn luma-btn--sm" id="ext-hub-ctxAddBtn">Add context</button>
      <button class="luma-btn" id="ext-hub-ctxSaveBtn">Save contexts</button>
    </div>`;
  }

  bind(container) {
    super.bind(container);
    this.$('ctxAddBtn').addEventListener('click', () => this._add());
    this.$('ctxSaveBtn').addEventListener('click', () => this._save());
    this.$('ctxList').addEventListener('click', (e) => this._onAction(e));
  }

  async load() {
    if (!this._root) return;
    const [contexts, choices] = await Promise.all([this.call('listContexts'), this.call('listContextChoices').catch(() => ({}))]);
    this._contexts = (contexts.contexts || []).map((c) => ({ ...c, rules: (c.rules || []).slice() }));
    this._choices = { tabs: choices.tabs || [], calendars: choices.calendars || [], trackers: choices.trackers || [] };
    this._render();
  }

  _render() {
    const list = this.$('ctxList');
    list.innerHTML = this._contexts.map((c, i) => this._contextHtml(c, i)).join('')
      || '<div class="luma-empty luma-empty--plain">No contexts yet. Add one for each company or area you work across.</div>';
  }

  _contextHtml(context, index) {
    const esc = WidgetDom.esc;
    const color = context.color || ContextsSection.PALETTE[index % ContextsSection.PALETTE.length];
    const values = (kind) => context.rules.filter((r) => r.kind === kind).map((r) => r.value);
    const typed = Object.entries(ContextsSection.TYPED).map(([kind, t]) => `
        <label class="luma-field-label" style="margin:0;min-width:96px" title="${esc(t.help)}">${esc(t.label)}</label>
        <input type="text" class="luma-field-input" data-typed="${kind}" value="${esc(values(kind).join(', '))}" placeholder="${esc(t.placeholder)}" title="${esc(t.help)}" aria-label="${esc(t.label)}">`);
    return `
      <div class="ext-hub-context ext-mb-8" data-index="${index}" style="border:1px solid var(--border-soft);border-radius:var(--radius-md);padding:10px 12px">
        <div class="ext-form-row-inline">
          <input type="color" data-field="color" value="${esc(color)}" aria-label="Colour" style="width:34px;height:28px;padding:0;border:0;background:transparent">
          <input type="text" class="luma-field-input" data-field="name" value="${esc(context.name || '')}" placeholder="Company or area, for example Acme" aria-label="Context name">
          <button class="luma-btn luma-btn--sm" data-action="up" title="Move up"${index === 0 ? ' disabled' : ''}>Up</button>
          <button class="luma-btn luma-btn--sm" data-action="down" title="Move down"${index === this._contexts.length - 1 ? ' disabled' : ''}>Down</button>
          <button class="luma-btn luma-btn--sm" data-action="remove" title="Remove this context">Remove</button>
        </div>
        ${this._ticks('Tabs', 'partition', this._choices.tabs, values('partition'), 'No signed-in tabs found yet.')}
        ${this._ticks('Calendars', 'calendar', this._choices.calendars, values('calendar'), 'No calendars connected yet.')}
        ${this._ticks('Trackers', 'tasks', this._choices.trackers, values('tasks'), 'No task trackers connected yet.')}
        ${typed.map((row) => `<div class="ext-form-row-inline ext-mt-8">${row}</div>`).join('')}
      </div>`;
  }

  _ticks(label, kind, choices, chosen, emptyText) {
    const esc = WidgetDom.esc;
    const known = new Set(choices.map((c) => c.value));
    const all = [...choices, ...chosen.filter((v) => !known.has(v)).map((v) => ({ value: v, label: `${v} (not open)` }))];
    const boxes = all.map((c) => `
          <label class="luma-check" style="margin-right:12px"><input type="checkbox" data-rule="${kind}" value="${esc(c.value)}"${chosen.includes(c.value) ? ' checked' : ''}> ${esc(c.label)}</label>`).join('');
    return `
        <div class="ext-form-row-inline ext-mt-8" style="flex-wrap:wrap;align-items:center">
          <span class="luma-field-label" style="margin:0;min-width:96px">${esc(label)}</span>
          ${boxes || `<span class="luma-field-help" style="margin:0">${esc(emptyText)}</span>`}
        </div>`;
  }

  _read() {
    return this.$$('#ext-hub-ctxList [data-index]').map((block) => {
      const previous = this._contexts[Number(block.dataset.index)] || {};
      const rules = [...block.querySelectorAll('input[data-rule]:checked')].map((box) => ({ kind: box.dataset.rule, value: box.value }));
      for (const input of block.querySelectorAll('input[data-typed]')) {
        for (const value of input.value.split(',').map((v) => v.trim()).filter(Boolean)) rules.push({ kind: input.dataset.typed, value });
      }
      return {
        id: previous.id,
        name: block.querySelector('[data-field="name"]').value.trim(),
        color: block.querySelector('[data-field="color"]').value,
        rules,
      };
    });
  }

  _onAction(e) {
    const button = e.target.closest('button[data-action]');
    if (!button) return;
    const index = Number(button.closest('[data-index]').dataset.index);
    this._contexts = this._read();
    const swap = (a, b) => { [this._contexts[a], this._contexts[b]] = [this._contexts[b], this._contexts[a]]; };
    if (button.dataset.action === 'remove') this._contexts.splice(index, 1);
    if (button.dataset.action === 'up' && index > 0) swap(index, index - 1);
    if (button.dataset.action === 'down' && index < this._contexts.length - 1) swap(index, index + 1);
    this._render();
  }

  _add() {
    this._contexts = this._read();
    this._contexts.push({ name: '', color: ContextsSection.PALETTE[this._contexts.length % ContextsSection.PALETTE.length], rules: [] });
    this._render();
    const blocks = this.$$('#ext-hub-ctxList [data-index]');
    const last = blocks[blocks.length - 1];
    if (last) last.querySelector('[data-field="name"]').focus();
  }

  _save() {
    const contexts = this._read().filter((c) => c.name);
    return this.act(() => this.call('saveContexts', contexts), 'Contexts saved.');
  }
}
