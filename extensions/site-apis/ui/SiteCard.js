import Dom from '../../../core/llm-server/ui/js/dom/Dom.js';
import Dialogs from '../../../core/llm-server/ui/js/dialogs/Dialogs.js';
import StatusText from './StatusText.js';
import EndpointRow from './EndpointRow.js';

export default class SiteCard {
  constructor({ site, invoke, reload, openBuilder }) {
    this._site = site;
    this._invoke = invoke;
    this._reload = reload;
    this._openBuilder = openBuilder;
    this._rows = [];
  }

  get rows() { return this._rows; }

  render() {
    const site = this._site;
    const card = Dom.el('div', 'luma-card sapi-site');
    card.dataset.siteId = site.id;
    const main = Dom.el('div', 'luma-card-main');
    main.appendChild(this._head());
    main.appendChild(Dom.el('div', 'sapi-site-origin', null)).textContent = site.origin;
    if (site.statusNote) main.appendChild(Dom.el('div', 'sapi-site-note', null)).textContent = site.statusNote;
    main.appendChild(this._actions());
    main.appendChild(this._endpoints());
    card.appendChild(main);
    return card;
  }

  _head() {
    const head = Dom.el('div', 'sapi-site-head');
    head.appendChild(Dom.el('span', 'sapi-site-name', null)).textContent = this._site.name;
    const pill = StatusText.sitePill(this._site);
    const badge = Dom.el('span', `luma-badge ${pill.cls} sapi-site-status`, pill.label);
    badge.title = pill.title;
    head.appendChild(badge);
    return head;
  }

  _actions() {
    const actions = Dom.el('div', 'sapi-actions');
    actions.appendChild(SiteCard._button('Open tab', 'sapi-open-tab-btn', () => this._showTab()));
    actions.appendChild(SiteCard._button('Edit in chat', 'sapi-edit-btn', () => this._openBuilder({ siteId: this._site.id })));
    actions.appendChild(SiteCard._button('Delete', 'sapi-delete-site-btn danger', () => this._delete()));
    return actions;
  }

  _endpoints() {
    const wrap = Dom.el('div', 'sapi-endpoints');
    const endpoints = Array.isArray(this._site.endpoints) ? this._site.endpoints : [];
    if (!endpoints.length) {
      wrap.appendChild(Dom.el('div', 'luma-empty luma-empty--plain', 'No endpoints yet. Edit in chat to record one.'));
      return wrap;
    }
    this._rows = endpoints.map((endpoint) => new EndpointRow({ site: this._site, endpoint, invoke: this._invoke, reload: this._reload }));
    for (const row of this._rows) wrap.appendChild(row.render());
    return wrap;
  }

  async _showTab() {
    try {
      const result = await this._invoke('showSiteTab', this._site.id);
      if (result && result.success === false) await Dialogs.alert(result.error || 'Could not open the tab.');
      else SiteCard._closeSettings();
    } catch (err) {
      console.error('site-apis: show tab failed:', err);
    }
  }

  async _delete() {
    const count = (this._site.endpoints || []).length;
    const ok = await Dialogs.confirm(`Delete "${this._site.name}" with its ${count} endpoint${count === 1 ? '' : 's'} and their run history?`, { okLabel: 'Delete', danger: true });
    if (!ok) return;
    try {
      const result = await this._invoke('deleteSite', this._site.id);
      if (result && result.success === false) await Dialogs.alert(`Could not delete the site: ${result.error || 'unknown error'}`);
    } catch (err) {
      console.error('site-apis: delete site failed:', err);
    }
    await this._reload();
  }

  static _button(label, cls, onClick) {
    const btn = Dom.el('button', `luma-btn luma-btn--sm ${cls}`, label);
    btn.type = 'button';
    btn.addEventListener('click', (e) => { e.preventDefault(); onClick(); });
    return btn;
  }

  static _closeSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.remove('active');
  }
}
