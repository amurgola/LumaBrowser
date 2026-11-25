import HtmlEscaper from '../../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import ToolGroupsView from '../ToolGroupsView.js';

export default class SharingUserPermissions {
  static FLAG_LABELS = {
    shareLocalLlm: 'Local LLM',
    shareRemoteLlms: 'Remote-setup LLMs',
    shareImageGen: 'Image generation',
    shareImageEdit: 'Image editor',
    shareVideoGen: 'Video generation',
    shareGpus: 'GPUs for distributed inference',
    shareAgents: 'Custom agents',
    shareVoice: 'Voice',
  };
  static LISTS = [
    { field: 'llms', label: 'Chat models', empty: 'No chat models to choose from.' },
    { field: 'imageModels', label: 'Image and video models', empty: 'No image or video models installed.' },
  ];

  constructor({ container, catalog, master, user, visibleToolGroups, onSave, onClose }) {
    this._container = container;
    this._catalog = catalog || {};
    this._master = master || {};
    this._visibleToolGroups = visibleToolGroups || ((groups) => groups);
    this._onSave = onSave;
    this._onClose = onClose;
    this._state = SharingUserPermissions.stateFrom(user && user.overrides);
    this._expanded = new Set();
    this._container.addEventListener('change', (e) => this._onChange(e.target));
  }

  render() {
    this._container.innerHTML = this._html();
    this._drawTools();
    this._wireButtons();
  }

  static stateFrom(overrides) {
    const source = overrides || {};
    const flags = {};
    for (const name of Object.keys(SharingUserPermissions.FLAG_LABELS)) {
      const value = source.shareFlags ? source.shareFlags[name] : undefined;
      flags[name] = typeof value === 'boolean' ? (value ? 'on' : 'off') : 'inherit';
    }
    const asSet = (list) => (Array.isArray(list) ? new Set(list) : null);
    return { flags, llms: asSet(source.llms), imageModels: asSet(source.imageModels), tools: asSet(source.tools) };
  }

  static overridesFrom(state) {
    const shareFlags = {};
    for (const [name, choice] of Object.entries(state.flags)) {
      if (choice !== 'inherit') shareFlags[name] = choice === 'on';
    }
    const asList = (set) => (set ? [...set] : null);
    return { shareFlags, llms: asList(state.llms), imageModels: asList(state.imageModels), tools: asList(state.tools) };
  }

  static inheritLabel(master, flag) {
    return `Inherit (${master[flag] ? 'on' : 'off'})`;
  }

  static masterTools(master) {
    if (Array.isArray(master.webAllowedTools)) return master.webAllowedTools;
    return Array.isArray(master.webDefaultTools) ? master.webDefaultTools : [];
  }

  _html() {
    return `
      <div class="gs-user-perms">
        <p class="gs-row-help">Anything left on Inherit follows the master settings above, including later changes to them.</p>
        <div class="gs-choice-list gs-user-perm-flags">${this._flagsHtml()}</div>
        ${SharingUserPermissions.LISTS.map((list) => this._listHtml(list)).join('')}
        ${this._toolsHtml()}
        <div class="gs-inline-controls">
          <button class="gs-action-btn" data-perm-save>Save permissions</button>
          <button class="gs-copy-btn" data-perm-close>Close</button>
        </div>
      </div>`;
  }

  _flagsHtml() {
    const esc = HtmlEscaper.escape;
    return Object.entries(SharingUserPermissions.FLAG_LABELS).map(([flag, label]) => {
      const choice = this._state.flags[flag];
      const option = (value, text) => `<option value="${value}"${choice === value ? ' selected' : ''}>${esc(text)}</option>`;
      return `
        <label class="gs-user-perm-flag"><span>${esc(label)}</span>
          <select class="form-select gs-input-select" data-perm-flag="${flag}" aria-label="${esc(label)}">
            ${option('inherit', SharingUserPermissions.inheritLabel(this._master, flag))}${option('on', 'Allow')}${option('off', 'Block')}
          </select>
        </label>`;
    }).join('');
  }

  _listHtml({ field, label, empty }) {
    const esc = HtmlEscaper.escape;
    const items = this._items(field);
    const chosen = this._state[field];
    const boxes = items.length
      ? items.map((item) => `<label class="luma-check"><input type="checkbox" data-perm-item="${field}" value="${esc(item.value)}"${chosen && chosen.has(item.value) ? ' checked' : ''}> ${esc(item.label)}</label>`).join('')
      : `<div class="gs-list-empty">${esc(empty)}</div>`;
    return `
      <div class="gs-user-perm-list">
        <label class="luma-check"><input type="checkbox" data-perm-inherit="${field}"${chosen ? '' : ' checked'}> ${esc(label)}: inherit the master settings</label>
        <div class="gs-choice-list gs-row--nested" data-perm-list="${field}"${chosen ? '' : ' hidden'}>${boxes}</div>
      </div>`;
  }

  _toolsHtml() {
    const inherit = !this._state.tools;
    return `
      <div class="gs-user-perm-list">
        <label class="luma-check"><input type="checkbox" data-perm-inherit="tools"${inherit ? ' checked' : ''}> Chat tools: inherit the master list</label>
        <div class="gs-item-list gs-row--nested" data-perm-tools${inherit ? ' hidden' : ''}></div>
      </div>`;
  }

  _items(field) {
    if (field === 'llms') return (this._catalog.llms || []).map((model) => ({ value: model.ref, label: model.label || model.ref }));
    return (this._catalog.imageModels || []).map((model) => ({ value: model.id, label: `${model.label || model.id} (${(model.kinds || []).join(', ')})` }));
  }

  _drawTools() {
    const wrap = this._container.querySelector('[data-perm-tools]');
    if (!wrap || !this._state.tools) return;
    ToolGroupsView.render(wrap, this._visibleToolGroups(this._catalog.toolGroups || []), this._state.tools, {
      expanded: this._expanded,
      emptyText: 'No tools are available to shared clients. Enable some under API & MCP first.',
    });
  }

  _wireButtons() {
    this._container.querySelector('[data-perm-save]').addEventListener('click', () => this._onSave(SharingUserPermissions.overridesFrom(this._state)));
    this._container.querySelector('[data-perm-close]').addEventListener('click', () => this._onClose());
  }

  _onChange(target) {
    if (target.hasAttribute('data-perm-flag')) this._state.flags[target.getAttribute('data-perm-flag')] = target.value;
    else if (target.hasAttribute('data-perm-inherit')) this._setInherit(target.getAttribute('data-perm-inherit'), target.checked);
    else if (target.hasAttribute('data-perm-item')) this._toggleItem(target.getAttribute('data-perm-item'), target.value, target.checked);
  }

  _setInherit(field, inherit) {
    if (inherit) this._state[field] = null;
    else if (field === 'tools') this._state.tools = new Set(SharingUserPermissions.masterTools(this._master));
    else this._state[field] = new Set(this._items(field).map((item) => item.value));
    this.render();
  }

  _toggleItem(field, value, on) {
    const set = this._state[field];
    if (!set) return;
    if (on) set.add(value);
    else set.delete(value);
  }
}
