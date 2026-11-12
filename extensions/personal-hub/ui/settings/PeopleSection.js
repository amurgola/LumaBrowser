import WidgetDom from '../widgets/WidgetDom.js';
import HubSection from './HubSection.js';

export default class PeopleSection extends HubSection {
  static SEARCH_DEBOUNCE_MS = 250;
  static SHOWN = 60;

  constructor(tab) {
    super(tab);
    this._contacts = [];
    this._suggestions = [];
    this._contexts = new Map();
    this._searchTimer = null;
  }

  html() {
    return `
    <h4 class="luma-section-label">People</h4>
    <div class="luma-field-help">Everyone who has reached you, however they appear. The same address, or the same full name within one context, is treated as one person. The same name in two contexts is only suggested, because people share names and work with several companies. Summaries use this to know that a Slack name and a mail sender are the same person.</div>
    <div class="ext-mt-8" id="ext-hub-pplSuggestions"></div>
    <div class="ext-form-row-inline ext-mt-8">
      <input type="text" class="luma-field-input" id="ext-hub-pplSearch" placeholder="Find a person, address or app" aria-label="Find a person">
      <button class="luma-btn luma-btn--sm" id="ext-hub-pplMergeBtn" title="Tick two or more people who are the same person, then merge them">Merge ticked</button>
    </div>
    <div class="ext-mt-8" id="ext-hub-pplList"></div>`;
  }

  bind(container) {
    super.bind(container);
    this.$('pplSearch').addEventListener('input', () => {
      clearTimeout(this._searchTimer);
      this._searchTimer = setTimeout(() => { this.load().catch(() => {}); }, PeopleSection.SEARCH_DEBOUNCE_MS);
    });
    this.$('pplMergeBtn').addEventListener('click', () => this._mergeTicked());
    this.$('pplList').addEventListener('click', (e) => this._onListClick(e));
    this.$('pplList').addEventListener('change', (e) => this._onRename(e));
    this.$('pplSuggestions').addEventListener('click', (e) => this._onSuggestionClick(e));
  }

  unbind() {
    clearTimeout(this._searchTimer);
    super.unbind();
  }

  async load() {
    if (!this._root) return;
    const query = this.$('pplSearch').value.trim();
    const [people, contexts] = await Promise.all([this.call('listContacts', { query, limit: PeopleSection.SHOWN }), this.call('listContexts').catch(() => ({}))]);
    this._contacts = people.contacts || [];
    this._suggestions = people.suggestions || [];
    this._contexts = new Map((contexts.contexts || []).map((c) => [c.id, c.name]));
    this._render();
  }

  _where(identity) {
    return [identity.app, identity.contextId ? this._contexts.get(identity.contextId) || '' : ''].filter(Boolean).join(', ');
  }

  _summaryOf(contact) {
    return [...new Set(contact.identities.map((i) => this._where(i)))].join('; ');
  }

  _render() {
    const esc = WidgetDom.esc;
    this.$('pplSuggestions').innerHTML = this._suggestions.map((s, i) => `
      <div class="ext-form-row-inline ext-mb-8" data-suggestion="${i}" style="align-items:center">
        <span class="luma-field-help" style="margin:0;flex:1">Same person? <strong>${esc(s.a.name)}</strong> (${esc(this._summaryOf(s.a))}) and <strong>${esc(s.b.name)}</strong> (${esc(this._summaryOf(s.b))})</span>
        <button class="luma-btn luma-btn--sm" data-action="same">Same person</button>
        <button class="luma-btn luma-btn--sm" data-action="different">Different people</button>
      </div>`).join('');
    this.$('pplList').innerHTML = this._contacts.map((c) => `
      <div class="ext-hub-person ext-mb-8" data-contact="${esc(c.id)}">
        <div class="ext-form-row-inline" style="align-items:center">
          <input type="checkbox" data-field="tick" aria-label="Tick ${esc(c.name)} to merge">
          <input type="text" class="luma-field-input" data-field="name" value="${esc(c.name)}" aria-label="Name" style="max-width:260px">
          <span class="luma-field-help" style="margin:0">${c.count} notification${c.count === 1 ? '' : 's'}</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 0 26px">${c.identities.map((i) => `
          <span class="luma-badge muted" data-identity="${esc(i.id)}" title="${esc(i.handle)}">${esc(this._where(i))}: ${esc(i.display || i.handle)}${c.identities.length > 1 ? ` <button class="luma-btn luma-btn--sm" data-action="split" title="This is someone else: make it a person of its own" style="margin-left:6px">Split</button>` : ''}</span>`).join('')}
        </div>
      </div>`).join('') || `<div class="luma-empty luma-empty--plain">${this.$('pplSearch').value.trim() ? 'Nobody matches.' : 'Nobody yet. People appear here as notifications arrive.'}</div>`;
  }

  _onRename(e) {
    const input = e.target.closest('input[data-field="name"]');
    if (!input) return undefined;
    const id = input.closest('[data-contact]').dataset.contact;
    return this.act(() => this.call('renameContact', id, input.value.trim()), 'Name saved.');
  }

  _onListClick(e) {
    const button = e.target.closest('button[data-action="split"]');
    if (!button) return undefined;
    const identityId = button.closest('[data-identity]').dataset.identity;
    return this.act(() => this.call('splitContactIdentity', identityId), 'Split into a person of its own.');
  }

  _onSuggestionClick(e) {
    const button = e.target.closest('button[data-action]');
    if (!button) return undefined;
    const pair = this._suggestions[Number(button.closest('[data-suggestion]').dataset.suggestion)];
    if (!pair) return undefined;
    if (button.dataset.action === 'same') return this.act(() => this.call('mergeContacts', pair.a.id, pair.b.id), 'Merged.');
    return this.act(() => this.call('keepContactsApart', pair.a.id, pair.b.id), 'Kept apart.');
  }

  _mergeTicked() {
    const ids = this.$$('#ext-hub-pplList input[data-field="tick"]:checked').map((box) => box.closest('[data-contact]').dataset.contact);
    if (ids.length < 2) return this._tab.notify('Tick two or more people to merge.', false);
    return this.act(async () => {
      for (const fromId of ids.slice(1)) await this.call('mergeContacts', ids[0], fromId);
    }, 'Merged.');
  }
}
