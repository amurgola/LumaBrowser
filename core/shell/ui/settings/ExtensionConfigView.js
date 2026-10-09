import HtmlEscaper from '../../../llm-server/ui/js/format/HtmlEscaper.js';
import ExtensionConfigHeader from './ExtensionConfigHeader.js';

export default class ExtensionConfigView {
  static OPEN_SETUP_CHANNEL = 'core.llmServer.openSetup';

  static SAVE_BUTTON = /^\s*save\b/i;

  constructor({ pane, meta, settingsEntries, hooks, fileActions, onBack, onOpenTab = () => {} }) {
    this._pane = pane;
    this._meta = meta;
    this._entries = settingsEntries;
    this._hooks = hooks;
    this._fileActions = fileActions;
    this._onBack = onBack;
    this._onOpenTab = onOpenTab;
  }

  show(extensionId) {
    if (!this._pane) return;
    const entry = this._entries.get(extensionId);
    const meta = this._meta.get(extensionId);
    if (entry && entry.tab) this._onOpenTab(entry.tab);
    else if (!entry) this._showDefault(extensionId, meta);
    else this._showPage(extensionId, entry, meta);
  }

  _showPage(extensionId, entry, meta) {
    const esc = HtmlEscaper.escape;
    const displayName = (meta && meta.name) || entry.label;
    const subtitle = (entry.label && entry.label !== displayName) ? entry.label : '';
    this._pane.innerHTML = '';
    this._pane.appendChild(this._header(extensionId, meta, {
      titleHtml: `${esc(displayName)}${subtitle ? ` <span class="luma-badge muted">${esc(subtitle)}</span>` : ''}`,
      isPrivate: !!(meta && meta.private),
    }));
    entry.element.style.display = '';
    this._pane.appendChild(entry.element);
    ExtensionConfigView._noteManualSave(entry.element);
    if (entry.onActivate) {
      try { entry.onActivate(); } catch (e) { console.error('Extension onActivate error:', e); }
    }
  }

  static _noteManualSave(element) {
    const hasSave = [...element.querySelectorAll('button')].some((b) => ExtensionConfigView.SAVE_BUTTON.test(b.textContent || ''));
    if (!hasSave || element.querySelector('.ext-save-note')) return;
    const note = document.createElement('div');
    note.className = 'luma-muted ext-save-note';
    note.style.margin = '0 0 10px';
    note.textContent = 'This page saves when you click Save.';
    element.insertBefore(note, element.firstChild);
  }

  _showDefault(extensionId, meta) {
    const name = (meta && meta.name) || extensionId;
    const isPrivate = !!(meta && meta.private);
    this._pane.innerHTML = '';
    this._pane.appendChild(this._header(extensionId, meta, {
      titleHtml: `${HtmlEscaper.escape(name)}${isPrivate ? ' <span class="ext-private-badge">Private</span>' : ''}`,
      isPrivate,
    }));
    this._pane.appendChild(this._defaultBody(extensionId, meta, name));
  }

  _header(extensionId, meta, view) {
    return ExtensionConfigHeader.build({
      ...view,
      description: meta && meta.description,
      dependencies: (meta && meta.dependencies) || [],
    }, {
      onBack: () => this._onBack(),
      onEdit: () => this._fileActions.edit(extensionId),
      onExport: () => this._fileActions.export(extensionId),
    });
  }

  _defaultBody(extensionId, meta, name) {
    const body = document.createElement('div');
    body.className = 'ext-default-config';
    body.innerHTML = `
      ${ExtensionConfigView._noteHtml(meta && meta.setupTab, name)}
      <div class="ext-default-config-meta">
        ${ExtensionConfigView._metaRows(extensionId, meta).map(([k, v]) => `
          <div class="ext-default-config-row">
            <span class="ext-default-config-key">${HtmlEscaper.escape(k)}</span>
            <span class="ext-default-config-val">${HtmlEscaper.escape(v)}</span>
          </div>`).join('')}
      </div>
    `;
    const openBtn = body.querySelector('#extOpenSetupTabBtn');
    if (openBtn) openBtn.addEventListener('click', () => this._openSetupTab());
    return body;
  }

  static _noteHtml(setupTab, name) {
    if (!setupTab) {
      return `<div class="ext-default-config-note">This extension has no settings of its own. You can edit its code or export it from the buttons above.</div>`;
    }
    return `<div class="ext-default-config-note luma-callout">
           <div style="margin-bottom:8px;">This extension is configured in the LLM tab, under <b>Setup</b> as <b>${HtmlEscaper.escape(setupTab.label || name)}</b>.</div>
           <button class="luma-btn primary" id="extOpenSetupTabBtn">Open in the LLM tab</button>
         </div>`;
  }

  static _metaRows(extensionId, meta) {
    const rows = [['Version', (meta && meta.version) || 'unknown'], ['Identifier', extensionId]];
    const extDir = (meta && (meta._dir || meta.dir)) || '';
    if (extDir) rows.push(['Location', extDir]);
    return rows;
  }

  async _openSetupTab() {
    try {
      const r = await window.ipcBridge.invoke(ExtensionConfigView.OPEN_SETUP_CHANNEL, null);
      if (r && r.success === false) { this._hooks.toast(r.error || 'Could not open the LLM tab', 'bad'); return; }
      this._hooks.closeSettings();
    } catch (e) {
      this._hooks.toast(`Could not open the LLM tab: ${e.message}`, 'bad');
    }
  }
}
