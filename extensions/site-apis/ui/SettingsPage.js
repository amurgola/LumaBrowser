import Dom from '../../../core/llm-server/ui/js/dom/Dom.js';
import Dialogs from '../../../core/llm-server/ui/js/dialogs/Dialogs.js';
import StatusText from './StatusText.js';
import SiteCard from './SiteCard.js';

export default class SettingsPage {
  static NO_TABS = 'No persisted tabs. Open the site, sign in, then right-click its tab and choose Keep alive before creating a Site API.';

  constructor(root, { invoke, reload, openBuilder, getPersistedTabs }) {
    this._root = root;
    this._invoke = invoke;
    this._reload = reload;
    this._openBuilder = openBuilder;
    this._getPersistedTabs = getPersistedTabs || SettingsPage.persistedTabs;
    this._sites = [];
    this._cards = [];
    this._summaryEl = root ? root.querySelector('#ext-sapi-summary') : null;
    this._sitesEl = root ? root.querySelector('#ext-sapi-sites') : null;
    this._pickerEl = root ? root.querySelector('#ext-sapi-picker') : null;
    this._bindNew();
  }

  get cards() { return this._cards; }

  render(sites) {
    this._sites = Array.isArray(sites) ? sites : [];
    if (this._summaryEl) this._summaryEl.textContent = StatusText.summary(this._sites);
    if (!this._sitesEl) return;
    this._sitesEl.textContent = '';
    this._cards = [];
    if (!this._sites.length) {
      this._sitesEl.appendChild(Dom.el('div', 'luma-empty', 'No site APIs yet. Click New site API, pick a persisted tab, and record the first endpoint in the builder chat.'));
      return;
    }
    for (const site of this._sites) {
      const card = new SiteCard({ site, invoke: this._invoke, reload: this._reload, openBuilder: this._openBuilder });
      this._cards.push(card);
      this._sitesEl.appendChild(card.render());
    }
  }

  async togglePicker() {
    const el = this._pickerEl;
    if (!el) return;
    if (!el.classList.contains('ext-hidden')) { this.closePicker(); return; }
    let tabs = [];
    try { tabs = (await this._getPersistedTabs()) || []; } catch (_) { tabs = []; }
    el.textContent = '';
    el.classList.remove('ext-hidden');
    const list = Dom.el('div', 'sapi-picker');
    list.appendChild(Dom.el('div', 'luma-field-help ext-mt-0', tabs.length ? 'Pick the signed-in tab the Site API should use:' : SettingsPage.NO_TABS));
    for (const tab of tabs) list.appendChild(this._tabButton(tab));
    const cancel = Dom.el('button', 'luma-btn luma-btn--sm sapi-picker-cancel', 'Cancel');
    cancel.type = 'button';
    cancel.addEventListener('click', () => this.closePicker());
    list.appendChild(cancel);
    el.appendChild(list);
  }

  closePicker() {
    if (!this._pickerEl) return;
    this._pickerEl.textContent = '';
    this._pickerEl.classList.add('ext-hidden');
  }

  static persistedTabs() {
    if (!window.tabAPI || typeof window.tabAPI.getPersisted !== 'function') return Promise.resolve([]);
    return window.tabAPI.getPersisted();
  }

  _tabButton(tab) {
    const btn = Dom.el('button', 'luma-btn luma-btn--sm sapi-picker-tab');
    btn.type = 'button';
    btn.dataset.tabId = String(tab.id);
    const title = Dom.el('span');
    title.textContent = tab.title || tab.url || `Tab ${tab.id}`;
    btn.appendChild(title);
    if (tab.url) {
      const url = Dom.el('span', 'sapi-picker-url');
      url.textContent = tab.url;
      btn.appendChild(url);
    }
    btn.addEventListener('click', () => { this.closePicker(); this._openBuilder({ tabId: tab.id }); });
    return btn;
  }

  _bindNew() {
    const btn = this._root ? this._root.querySelector('#ext-sapi-newBtn') : null;
    if (btn) btn.addEventListener('click', () => this.togglePicker().catch((err) => Dialogs.alert(err && err.message ? err.message : String(err))));
  }
}
