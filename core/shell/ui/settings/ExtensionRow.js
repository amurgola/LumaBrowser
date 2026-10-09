import HtmlEscaper from '../../../llm-server/ui/js/format/HtmlEscaper.js';
import ManifestCopy from './ManifestCopy.js';

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
    const item = document.createElement('div');
    item.className = `ext-list-item${!constraint.enabled ? ' ext-list-item--disabled' : ''}${errors.length ? ' ext-list-item--error' : ''}`;
    item.innerHTML = this._html(ext, constraint, errors);
    this._wireToggle(item, ext);
    this._wireButtons(item, ext);
    return item;
  }

  static rowError(item, message) {
    let el = item.querySelector('.ext-list-item-error[data-live]');
    if (!el) {
      el = document.createElement('div');
      el.className = 'ext-list-item-error';
      el.setAttribute('data-live', '1');
      (item.querySelector('.ext-list-item-info') || item).appendChild(el);
    }
    el.innerHTML = `<span class="luma-badge bad">Error</span><span>${HtmlEscaper.escape(message)}</span>`;
  }

  _html(ext, constraint, errors) {
    const esc = HtmlEscaper.escape;
    const isEnabled = constraint.enabled;
    const tagsHtml = ExtensionRow._tagsHtml(ext.dependencies || []);
    return `
      <div class="ext-list-item-info">
        <div class="ext-list-item-name">${esc(ext.name)} <span class="ext-list-item-version">v${esc(ext.version)}</span></div>
        <div class="ext-list-item-desc">${esc(ManifestCopy.clean(ext.description))}</div>
        ${tagsHtml ? `<div class="ext-list-item-tags">${tagsHtml}</div>` : ''}
        ${this._reasonHtml(ext, constraint)}
        ${ExtensionRow._errorHtml(errors)}
      </div>
      <div class="ext-list-item-actions">
        ${isEnabled ? '<button class="btn btn-secondary ext-list-configure-btn">Configure</button>' : ''}
        ${constraint.deletable ? '<button class="btn btn-secondary ext-list-delete-btn" title="Permanently delete this extension and its files">Delete</button>' : ''}
        <label class="luma-switch" title="${esc(constraint.reason || (isEnabled ? 'Disable' : 'Enable'))}">
          <input type="checkbox" ${isEnabled ? 'checked' : ''} ${!constraint.canToggle ? 'disabled' : ''}>
          <span class="luma-switch-track"></span>
        </label>
      </div>
    `;
  }

  static _tagsHtml(deps) {
    const esc = HtmlEscaper.escape;
    return deps.filter((d) => !d.isCore).map((d) => {
      const color = d.installed ? 'ok' : 'bad';
      const stateHtml = d.installed ? '' : ' <span class="ext-tag-state">missing</span>';
      return `<span class="luma-badge ${color}" title="Extension: ${esc(d.name)}, ${d.installed ? 'installed' : 'missing'}${d.isRequired ? ' (required)' : ' (optional)'}">${esc(d.name)}${stateHtml}</span>`;
    }).join('');
  }

  _reasonHtml(ext, constraint) {
    const reasons = [];
    if (constraint.reason) reasons.push(constraint.reason);
    if (constraint.enabled && ext.loadable === false) {
      reasons.push(ext.unmetDependency
        ? `Not running: requires ${this._meta.displayName(ext.unmetDependency)} to be enabled.`
        : 'Not running: it failed to load when the app started.');
    }
    return reasons.length ? `<div class="ext-list-item-reason">${reasons.map((r) => HtmlEscaper.escape(r)).join(' ')}</div>` : '';
  }

  static _errorHtml(errors) {
    if (!errors.length) return '';
    const last = errors[errors.length - 1].error || 'Failed to start';
    const more = errors.length > 1 ? ` (+${errors.length - 1} more)` : '';
    return `<div class="ext-list-item-error"><span class="luma-badge bad">Error</span><span>${HtmlEscaper.escape(last)}${more}</span></div>`;
  }

  _wireToggle(item, ext) {
    const toggle = item.querySelector('.luma-switch input');
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
