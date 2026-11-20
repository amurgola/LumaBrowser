import WidgetDom from '../widgets/WidgetDom.js';
import ContactProfileForm from './ContactProfileForm.js';
import HubSection from './HubSection.js';

export default class PeopleSection extends HubSection {
  static SEARCH_DEBOUNCE_MS = 250;
  static SHOWN = 60;
  static READING = 'Reading what they sent you...';

  constructor(tab) {
    super(tab);
    this._contacts = [];
    this._suggestions = [];
    this._kinds = [];
    this._contexts = new Map();
    this._searchTimer = null;
    this._openId = null;
    this._drawn = '';
  }

  html() {
    return `
    <h4 class="luma-section-label">People</h4>
    <div class="luma-field-help">Everyone who has reached you, however they appear. The same address, the same name on one app, or the same full name within one context is treated as one person. The same name on different apps in two contexts is only suggested, because people share names. Summaries use this to know that a Slack name and a mail sender are the same person, and what you record under About tells the assistant who each one is to you.</div>
    <div class="ext-mt-8" id="ext-hub-pplSuggestions"></div>
    <div class="ext-form-row-inline ext-mt-8">
      <input type="text" class="luma-field-input" id="ext-hub-pplSearch" placeholder="Find a person, address, app or relation" aria-label="Find a person">
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

  focus({ contactId, name = '' } = {}) {
    if (!this._root || !contactId) return;
    this.$('pplSearch').value = name;
    this._openId = contactId;
  }

  async load() {
    if (!this._root) return;
    const query = this.$('pplSearch').value.trim();
    const [people, contexts] = await Promise.all([this.call('listContacts', { query, limit: PeopleSection.SHOWN }), this.call('listContexts').catch(() => ({}))]);
    this._contacts = people.contacts || [];
    this._suggestions = people.suggestions || [];
    this._kinds = people.kinds || [];
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
    const typed = this._unsaved();
    this.$('pplSuggestions').innerHTML = this._suggestions.map((s, i) => `
      <div class="ext-form-row-inline ext-mb-8" data-suggestion="${i}" style="align-items:center">
        <span class="luma-field-help" style="margin:0;flex:1">Same person? <strong>${esc(s.a.name)}</strong> (${esc(this._summaryOf(s.a))}) and <strong>${esc(s.b.name)}</strong> (${esc(this._summaryOf(s.b))})</span>
        <button class="luma-btn luma-btn--sm" data-action="same">Same person</button>
        <button class="luma-btn luma-btn--sm" data-action="different">Different people</button>
      </div>`).join('');
    this.$('pplList').innerHTML = this._contacts.map((c) => this._person(c)).join('')
      || `<div class="luma-empty luma-empty--plain">${this.$('pplSearch').value.trim() ? 'Nobody matches.' : 'Nobody yet. People appear here as notifications arrive.'}</div>`;
    const form = this._openForm();
    this._drawn = form ? JSON.stringify(ContactProfileForm.read(form)) : '';
    if (form && typed) ContactProfileForm.restore(form, typed, this._kinds);
    if (form && typeof form.scrollIntoView === 'function') form.scrollIntoView({ block: 'nearest' });
  }

  _unsaved() {
    const form = this._openForm();
    if (!form || form.dataset.profile !== this._openId) return null;
    return JSON.stringify(ContactProfileForm.read(form)) === this._drawn ? null : ContactProfileForm.capture(form);
  }

  _person(c) {
    const esc = WidgetDom.esc;
    const open = c.id === this._openId && this._kinds.length > 0;
    return `
      <div class="ext-hub-person ext-mb-8" data-contact="${esc(c.id)}">
        <div class="ext-form-row-inline" style="align-items:center">
          <input type="checkbox" data-field="tick" aria-label="Tick ${esc(c.name)} to merge">
          <input type="text" class="luma-field-input" data-field="name" value="${esc(c.name)}" aria-label="Name" style="max-width:260px">
          <span class="luma-field-help" style="margin:0">${c.count} notification${c.count === 1 ? '' : 's'}</span>
          ${this._kinds.length ? `<button class="luma-btn luma-btn--sm" data-action="toggle-profile" aria-expanded="${open}" title="What the assistant knows about this contact">${open ? 'Close' : 'About'}</button>` : ''}
        </div>
        ${this._aboutLine(c)}
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 0 26px">${c.identities.map((i) => `
          <span class="luma-badge muted" data-identity="${esc(i.id)}" title="${esc(i.handle)}">${esc(this._where(i))}: ${esc(i.display || i.handle)}${c.identities.length > 1 ? ` <button class="luma-btn luma-btn--sm" data-action="split" title="This is someone else: make it a person of its own" style="margin-left:6px">Split</button>` : ''}</span>`).join('')}
        </div>
        ${open ? ContactProfileForm.html(c, this._kinds, [...this._contexts].map(([id, name]) => ({ id, name }))) : ''}
      </div>`;
  }

  _aboutLine(c) {
    const waiting = c.profile && (c.profile.suggested || []).length ? 'Suggestions to look at under About.' : '';
    if (!c.about && c.kind !== 'person' && !waiting && !c.homeContextId) return '';
    const kind = (this._kinds.find((k) => k.kind === c.kind) || {}).label || '';
    const home = c.homeContextId ? this._contexts.get(c.homeContextId) || '' : '';
    const text = [[[kind, home].filter(Boolean).join(', '), c.about].filter(Boolean).join(': '), waiting].filter(Boolean).join(' ');
    return `<div class="luma-field-help" data-role="about" style="margin:4px 0 0 26px">${WidgetDom.esc(text)}</div>`;
  }

  _openForm() {
    return this._root ? this._root.querySelector('#ext-hub-pplList [data-profile]') : null;
  }

  _onRename(e) {
    const input = e.target.closest('input[data-field="name"]');
    if (!input) return undefined;
    const id = input.closest('[data-contact]').dataset.contact;
    return this.act(() => this.call('renameContact', id, input.value.trim()), 'Name saved.');
  }

  _onListClick(e) {
    const button = e.target.closest('button[data-action]');
    if (!button) return undefined;
    const id = button.closest('[data-contact]').dataset.contact;
    const form = button.closest('[data-profile]');
    switch (button.dataset.action) {
      case 'split': return this.act(() => this.call('splitContactIdentity', button.closest('[data-identity]').dataset.identity), 'Split into a person of its own.');
      case 'toggle-profile': return this._toggleProfile(id);
      case 'kind': return ContactProfileForm.setKind(form, button.dataset.kind, this._kinds);
      case 'add-detail': return ContactProfileForm.addDetail(form);
      case 'remove-detail': return button.closest('[data-detail]').remove();
      case 'save-profile': return this.act(() => this._save(id, form), 'Saved.');
      case 'learn': return this._learn(id, form, button);
      case 'accept-suggestion': return this._answer(id, form, button, true);
      case 'dismiss-suggestion': return this._answer(id, form, button, false);
      default: return undefined;
    }
  }

  _toggleProfile(id) {
    this._openId = this._openId === id ? null : id;
    this._render();
  }

  async _save(id, form) {
    const typed = ContactProfileForm.read(form);
    await this.call('saveContactProfile', id, typed);
    this._drawn = JSON.stringify(typed);
  }

  async _keepTyped(id, form) {
    if (JSON.stringify(ContactProfileForm.read(form)) !== this._drawn) await this._save(id, form);
  }

  async _learn(id, form, button) {
    const label = button.textContent;
    button.disabled = true;
    button.textContent = PeopleSection.READING;
    let message = '';
    await this.act(async () => {
      await this._keepTyped(id, form);
      message = PeopleSection._learned(await this.call('learnContact', id));
    });
    if (message) this._tab.notify(message, true);
    if (button.isConnected) {
      button.disabled = false;
      button.textContent = label;
    }
  }

  static _learned({ read = 0, added = 0 }) {
    if (!read) return 'Nothing this contact sent is in the log yet.';
    return added ? `${added} suggestion${added === 1 ? '' : 's'} to look at.` : 'Nothing new to suggest from their messages.';
  }

  _answer(id, form, button, accept) {
    const suggestionId = button.closest('[data-suggestion]').dataset.suggestion;
    return this.act(async () => {
      await this._keepTyped(id, form);
      await this.call('resolveContactSuggestion', id, suggestionId, accept);
    }, accept ? 'Added to what is known.' : 'Dismissed.');
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
