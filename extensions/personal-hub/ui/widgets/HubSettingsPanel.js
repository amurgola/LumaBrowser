import SummarySection from '../settings/SummarySection.js';
import ContextsSection from '../settings/ContextsSection.js';
import PeopleSection from '../settings/PeopleSection.js';
import HubWidgetStyles from './HubWidgetStyles.js';
import TaskChrome from './TaskChrome.js';
import WidgetDom from './WidgetDom.js';

export default class HubSettingsPanel {
  static NOTICE_MS = 6000;
  static PANES = [
    { key: 'summary', label: 'Summaries', section: SummarySection },
    { key: 'contexts', label: 'Contexts', section: ContextsSection },
    { key: 'people', label: 'People', section: PeopleSection },
  ];

  static _current = null;

  static button(host, pane = 'summary') {
    return WidgetDom.el('button', {
      class: 'hub-icon-btn hub-open-settings', title: 'Hub settings', 'aria-label': 'Hub settings',
      on: { click: (e) => HubSettingsPanel.open(host, pane, e.currentTarget.ownerDocument) },
    }, [TaskChrome.icon('settings')]);
  }

  static open(host, pane = 'summary', doc = document) {
    if (HubSettingsPanel._current) HubSettingsPanel._current.close();
    const panel = new HubSettingsPanel(host, doc);
    HubSettingsPanel._current = panel;
    panel.shown = panel.show(pane);
    return panel;
  }

  static closeCurrent() {
    if (HubSettingsPanel._current) HubSettingsPanel._current.close();
  }

  constructor(host, doc = document) {
    this._host = host;
    this._doc = doc;
    this._el = null;
    this._pane = 'summary';
    this._noticeTimer = null;
    this._sections = HubSettingsPanel.PANES.map((p) => ({ ...p, instance: new p.section(this) }));
    this._onKey = (e) => { if (e.key === 'Escape') this.close(); };
  }

  isOpen() {
    return !!this._el;
  }

  async show(pane = 'summary') {
    if (this._el) this.close();
    HubWidgetStyles.ensure(this._doc);
    this._pane = HubSettingsPanel.PANES.some((p) => p.key === pane) ? pane : 'summary';
    this._el = WidgetDom.el('div', { class: 'hub-settings-backdrop', on: { mousedown: (e) => { if (e.target === this._el) this.close(); } } }, [
      WidgetDom.el('div', { class: 'hub-settings', role: 'dialog', 'aria-label': 'Hub settings' }, [
        WidgetDom.el('div', { class: 'hub-settings-head' }, [
          WidgetDom.el('h2', { class: 'hub-title', text: 'Hub settings' }),
          WidgetDom.el('div', { class: 'hub-seg hub-settings-tabs', role: 'tablist' }),
          WidgetDom.el('span', { class: 'hub-spacer' }),
          WidgetDom.el('button', { class: 'hub-icon-btn hub-settings-close', title: 'Close', 'aria-label': 'Close', on: { click: () => this.close() } }, [TaskChrome.icon('close')]),
        ]),
        WidgetDom.el('div', { class: 'hub-settings-notice', id: 'ext-hub-notice' }),
        WidgetDom.el('div', { class: 'hub-settings-body' }, this._sections.map((s) => WidgetDom.el('div', { class: 'hub-settings-pane', data: { pane: s.key }, html: s.instance.html() }))),
        WidgetDom.el('div', { class: 'hub-settings-foot', text: 'Accounts, calendars, task trackers and automation are set up in Settings > Hub.' }),
      ]),
    ]);
    this._doc.body.appendChild(this._el);
    this._doc.addEventListener('keydown', this._onKey);
    for (const s of this._sections) s.instance.bind(this._el.querySelector(`.hub-settings-pane[data-pane="${s.key}"]`));
    this._paintTabs();
    await this.reloadAll();
  }

  close() {
    clearTimeout(this._noticeTimer);
    this._doc.removeEventListener('keydown', this._onKey);
    for (const s of this._sections) s.instance.unbind();
    if (this._el && this._el.parentNode) this._el.parentNode.removeChild(this._el);
    this._el = null;
    if (HubSettingsPanel._current === this) HubSettingsPanel._current = null;
  }


  invoke(channel, ...args) {
    return this._host.call('settingsInvoke', channel, args);
  }

  notify(message, ok) {
    const line = this._el ? this._el.querySelector('.hub-settings-notice') : null;
    if (!line) return;
    line.textContent = message || '';
    line.classList.toggle('is-error', !ok);
    clearTimeout(this._noticeTimer);
    if (message) this._noticeTimer = setTimeout(() => { if (this._el) line.textContent = ''; }, HubSettingsPanel.NOTICE_MS);
  }

  async reloadAll() {
    if (!this._el) return;
    await Promise.all(this._sections.map((s) => s.instance.load().catch((err) => this.notify((err && err.message) || String(err), false))));
  }


  _paintTabs() {
    const tabs = this._el.querySelector('.hub-settings-tabs');
    tabs.innerHTML = '';
    for (const pane of HubSettingsPanel.PANES) {
      tabs.appendChild(WidgetDom.el('button', {
        class: this._pane === pane.key ? 'is-on' : '', text: pane.label, role: 'tab', data: { pane: pane.key },
        'aria-selected': this._pane === pane.key ? 'true' : 'false',
        on: { click: () => { this._pane = pane.key; this._paintTabs(); } },
      }));
    }
    for (const el of this._el.querySelectorAll('.hub-settings-pane')) el.hidden = el.dataset.pane !== this._pane;
  }
}
