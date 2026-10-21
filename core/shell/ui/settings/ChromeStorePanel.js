import HtmlEscaper from '../../../llm-server/ui/js/format/HtmlEscaper.js';
import ExtCard from './ExtCard.js';

export default class ChromeStorePanel {
  static PARTIAL = 'partial';

  constructor(container, { invoke, onInstalled, onRemove = null }) {
    this._container = container;
    this._invoke = invoke;
    this._onInstalled = onInstalled;
    this._onRemove = onRemove;
    this._entries = [];
    this._query = '';
    this._busyIds = new Set();
    this._openIds = new Set();
  }

  async load() {
    if (!this._container) return;
    try {
      this._entries = await this._invoke('core.chromeExtensions.catalog');
    } catch (err) {
      this._container.innerHTML = `<div class="luma-callout bad">Failed to load the extension store: ${HtmlEscaper.escape(err.message)}</div>`;
      return;
    }
    this._container.innerHTML = ChromeStorePanel._shellHtml();
    this._wireShell();
    this._renderList();
  }

  static _shellHtml() {
    return `
        <div class="ext-pane-head">
          <h4 class="gs-subsection-title">Extension store</h4>
          <input type="search" class="luma-field-input chrome-store-search" placeholder="Search" aria-label="Search extensions">
        </div>
        <p class="ext-pane-intro">Chrome Web Store extensions that work in LumaBrowser. They download from Google and keep their data across updates.</p>
        <div class="luma-callout bad chrome-store-error" style="display:none;"></div>
        <div class="chrome-store-list"></div>

        <h5 class="ext-pane-group-label">Install from a link</h5>
        <div class="gs-inline-controls chrome-store-custom">
          <input type="text" class="form-input chrome-store-custom-input" placeholder="Chrome Web Store link or 32-letter extension id" aria-label="Chrome Web Store link or id">
          <button class="luma-btn chrome-store-custom-btn">Install</button>
        </div>
        <p class="ext-pane-intro chrome-store-custom-note">Extensions outside the list may load but not work; see Limitations.</p>`;
  }

  _wireShell() {
    const list = this._container.querySelector('.chrome-store-list');
    ExtCard.wireFolding(list, { onToggle: (id, open) => (open ? this._openIds.add(id) : this._openIds.delete(id)) });
    list.addEventListener('click', (e) => this._onListClick(e));
    this._container.querySelector('.chrome-store-search').addEventListener('input', (e) => {
      this._query = e.target.value.trim().toLowerCase();
      this._renderList();
    });
    const input = this._container.querySelector('.chrome-store-custom-input');
    const button = this._container.querySelector('.chrome-store-custom-btn');
    const submit = () => input.value.trim() && this._install(input.value.trim(), button, () => { input.value = ''; });
    button.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
  }

  _renderList() {
    const list = this._container.querySelector('.chrome-store-list');
    const visible = this._entries.filter((e) => this._matches(e));
    list.innerHTML = visible.length
      ? ChromeStorePanel._groups(visible).map(([label, entries]) => this._groupHtml(label, entries)).join('')
      : '<div class="luma-empty">No extensions match.</div>';
  }

  _onListClick(e) {
    const button = e.target.closest && e.target.closest('button');
    const card = button && button.closest('[data-store-id]');
    if (!card || button.disabled) return;
    const entry = this._entries.find((x) => x.id === card.dataset.storeId);
    if (!entry) return;
    if (button.classList.contains('chrome-store-install')) this._install(entry.id, button);
    else if (button.classList.contains('chrome-store-remove') && this._onRemove) this._onRemove(entry.id, entry.name);
  }

  static _groups(entries) {
    const groups = new Map();
    for (const entry of entries) {
      if (!groups.has(entry.categoryLabel)) groups.set(entry.categoryLabel, []);
      groups.get(entry.categoryLabel).push(entry);
    }
    return [...groups.entries()];
  }

  _matches(entry) {
    if (!this._query) return true;
    return [entry.name, entry.description, entry.notes, entry.categoryLabel].some((text) => String(text || '').toLowerCase().includes(this._query));
  }

  _groupHtml(label, entries) {
    return `
        <h5 class="ext-pane-group-label">${HtmlEscaper.escape(label)}</h5>
        ${ExtCard.listHtml(entries.map((e) => ExtCard.html(this.cardSpec(e))))}`;
  }

  cardSpec(entry) {
    const esc = HtmlEscaper.escape;
    const busy = this._busyIds.has(entry.id);
    const partial = entry.compatibility === ChromeStorePanel.PARTIAL;
    let status = null;
    if (entry.installed) status = { text: 'Installed' };
    else if (partial) status = { text: 'Partial support', tone: 'warn' };
    return {
      id: entry.id,
      name: entry.name,
      version: entry.installed ? entry.installedVersion : '',
      summary: entry.description,
      description: [entry.description, entry.notes].filter(Boolean).join(' '),
      open: this._openIds.has(entry.id),
      status,
      primary: entry.installed ? null : { label: busy ? 'Installing...' : 'Install', cls: 'chrome-store-install', disabled: busy },
      details: [
        { label: 'Category', value: entry.categoryLabel || '' },
        { label: 'Works', value: partial ? 'Partly; see the notes above' : 'As described' },
      ],
      actions: entry.installed ? [{ label: 'Remove', cls: 'chrome-store-remove', danger: true }] : [],
      attrs: `data-store-id="${esc(entry.id)}"`,
    };
  }

  async _install(idOrUrl, button, onDone = null) {
    this._showError(null);
    this._busyIds.add(idOrUrl);
    button.disabled = true;
    button.textContent = 'Installing...';
    let result;
    try {
      result = await this._invoke('core.chromeExtensions.installFromStore', idOrUrl);
    } catch (err) {
      result = { success: false, error: err.message };
    } finally {
      this._busyIds.delete(idOrUrl);
    }
    if (!result.success) {
      button.disabled = false;
      button.textContent = 'Install';
      this._renderList();
      this._showError(result.error || 'Install failed');
      return;
    }
    if (onDone) onDone();
    await this.load();
    await this._onInstalled(result.extension);
  }

  _showError(message) {
    const el = this._container.querySelector('.chrome-store-error');
    if (!el) return;
    el.textContent = message || '';
    el.style.display = message ? 'block' : 'none';
  }
}
