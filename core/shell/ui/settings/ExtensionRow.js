import HtmlEscaper from '../../../llm-server/ui/js/format/HtmlEscaper.js';
import ManifestCopy from './ManifestCopy.js';
import ExtCard from './ExtCard.js';

export default class ExtensionRow {
  static TOGGLE_CHANNEL = 'core.shell.toggleExtension';

  constructor({ meta, host, onChanged, onConfigure, onDelete }) {
    this._meta = meta;
    this._host = host;
    this._onChanged = onChanged;
    this._onConfigure = onConfigure;
    this._onDelete = onDelete;
  }

  build(ext, constraints, errors) {
    const constraint = constraints[ext.id] || { enabled: ext.enabled !== false, canToggle: true, reason: '' };
    const holder = document.createElement('div');
    holder.innerHTML = ExtCard.html(this._spec(ext, constraint, errors)).trim();
    const item = holder.firstElementChild;
    this._wireToggle(item, ext);
    this._wireButtons(item, ext);
    return item;
  }

  static rowError(item, message) {
    const inner = item.querySelector('.ext-item-tray-inner');
    if (!inner) return;
    let el = inner.querySelector('.ext-item-error[data-live]');
    if (!el) {
      el = document.createElement('div');
      el.className = 'ext-item-error ext-list-item-error';
      el.setAttribute('data-live', '1');
      inner.insertBefore(el, inner.firstChild);
    }
    el.textContent = message;
    item.classList.add(ExtCard.OPEN_CLASS, 'ext-list-item--error');
  }

  _spec(ext, constraint, errors) {
    const isEnabled = constraint.enabled;
    const description = ManifestCopy.clean(ext.description);
    const tagsHtml = ExtensionRow._tagsHtml(ext.dependencies || []);
    const reasons = this._reasons(ext, constraint);
    const error = ExtensionRow._errorText(errors);
    const notRunning = isEnabled && ext.loadable === false;
    return {
      id: ext.id,
      name: ext.name,
      version: ext.version,
      summary: description,
      description,
      dim: !isEnabled,
      check: { checked: isEnabled, disabled: !constraint.canToggle, title: constraint.reason || undefined },
      status: error ? null : (notRunning ? { text: 'Not running', tone: 'warn' } : null),
      error,
      primary: isEnabled ? { label: 'Configure', cls: 'ext-list-configure-btn' } : null,
      details: [{ label: 'ID', value: ext.id, mono: true }],
      extraHtml: [
        tagsHtml ? `<div class="ext-list-item-tags">${tagsHtml}</div>` : '',
        reasons.length ? `<p class="ext-item-desc ext-list-item-reason">${reasons.map((r) => HtmlEscaper.escape(r)).join(' ')}</p>` : '',
      ].join(''),
      actions: constraint.deletable
        ? [{ label: 'Delete', cls: 'ext-list-delete-btn', danger: true, title: 'Permanently delete this extension and its files' }]
        : [],
    };
  }

  static _tagsHtml(deps) {
    const esc = HtmlEscaper.escape;
    return deps.filter((d) => !d.isCore).map((d) => {
      const color = d.installed ? 'ok' : 'bad';
      const stateHtml = d.installed ? '' : ' <span class="ext-tag-state">missing</span>';
      return `<span class="luma-badge ${color}" title="Extension: ${esc(d.name)}, ${d.installed ? 'installed' : 'missing'}${d.isRequired ? ' (required)' : ' (optional)'}">${esc(d.name)}${stateHtml}</span>`;
    }).join('');
  }

  _reasons(ext, constraint) {
    const reasons = [];
    if (constraint.reason) reasons.push(constraint.reason);
    if (constraint.enabled && ext.loadable === false) {
      reasons.push(ext.unmetDependency
        ? `Not running: requires ${this._meta.displayName(ext.unmetDependency)} to be enabled.`
        : 'Not running: it failed to load when the app started.');
    }
    return reasons;
  }

  static _errorText(errors) {
    if (!errors.length) return '';
    const last = errors[errors.length - 1].error || 'Failed to start';
    const more = errors.length > 1 ? ` (+${errors.length - 1} more)` : '';
    return `${last}${more}`;
  }

  _wireToggle(item, ext) {
    const toggle = item.querySelector('.ext-item-check');
    toggle.addEventListener('change', () => this._toggle(item, toggle, ext));
  }

  async _toggle(item, toggle, ext) {
    const newState = toggle.checked;
    toggle.disabled = true;
    try {
      const result = await window.ipcBridge.invoke(ExtensionRow.TOGGLE_CHANNEL, ext.id, newState);
      if (!result.success) {
        this._revert(item, toggle, newState, result.error || `Could not ${newState ? 'enable' : 'disable'} ${ext.name}`);
        return;
      }
      await this._applyToggle(ext.id, newState);
    } catch (e) {
      this._revert(item, toggle, newState, e.message);
    }
  }

  async _applyToggle(id, enabled) {
    const meta = this._meta.get(id);
    if (meta) meta.enabled = enabled;
    if (!enabled) this._host.disable(id);
    else await this._host.enable(id);
    document.dispatchEvent(new CustomEvent('extension-toggled', { detail: { id, enabled } }));
    this._onChanged();
  }

  _revert(item, toggle, attempted, message) {
    toggle.checked = !attempted;
    toggle.disabled = false;
    ExtensionRow.rowError(item, message);
  }

  _wireButtons(item, ext) {
    const cfgBtn = item.querySelector('.ext-list-configure-btn');
    if (cfgBtn) cfgBtn.addEventListener('click', () => this._onConfigure(ext.id));
    const delBtn = item.querySelector('.ext-list-delete-btn');
    if (delBtn) delBtn.addEventListener('click', () => this._onDelete(ext.id, ext.name));
  }
}
