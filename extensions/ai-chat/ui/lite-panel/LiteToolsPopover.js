export default class LiteToolsPopover {
  constructor({ button, pop, api, getDisabled, onToggle }) {
    this._button = button;
    this._pop = pop;
    this._api = api;
    this._getDisabled = getDisabled;
    this._onToggle = onToggle;
    this._catalog = null;
  }

  isOpen() {
    return !!(this._pop && this._pop.classList.contains('open'));
  }

  toggle() {
    if (!this._pop) return;
    const open = !this.isOpen();
    if (open) this.load();
    this._pop.classList.toggle('open', open);
    if (this._button) this._button.classList.toggle('is-open', open);
  }

  close() {
    if (this._pop) this._pop.classList.remove('open');
    if (this._button) this._button.classList.remove('is-open');
  }

  refreshIfOpen() {
    if (this.isOpen()) this.render();
  }

  async load() {
    if (!this._pop) return;
    if (!this._catalog) this._pop.innerHTML = '<div class="ai-chat-tools-note">Loading tools...</div>';
    await this._fetchCatalog();
    if (!this._catalog) {
      this._pop.innerHTML = '<div class="ai-chat-tools-note">Tools are not available yet.</div>';
      return;
    }
    this.render();
  }

  render() {
    if (!this._pop || !this._catalog) return;
    const globallyOff = new Set(this._catalog.disabled);
    const off = new Set(this._getDisabled());
    this._pop.textContent = '';
    let any = false;
    for (const group of this._catalog.groups) {
      const tools = (group.tools || []).filter((t) => !globallyOff.has(t.name));
      if (!tools.length) continue;
      any = true;
      this._pop.appendChild(this._groupHead(group));
      for (const tool of tools) this._pop.appendChild(this._toolRow(tool, !off.has(tool.name)));
    }
    if (!any) this._pop.appendChild(this._note('No tools are enabled for this install.'));
  }

  async _fetchCatalog() {
    try {
      const r = await this._api.chat.agentTools();
      if (r && r.success) this._catalog = { groups: r.groups || [], disabled: r.disabled || [] };
    } catch (_) {}
  }

  _groupHead(group) {
    const head = document.createElement('div');
    head.className = 'ai-chat-tools-group';
    head.textContent = group.label || group.id;
    return head;
  }

  _toolRow(tool, checked) {
    const label = document.createElement('label');
    label.className = 'luma-check';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = checked;
    cb.addEventListener('change', () => this._onToggle(tool.name, cb.checked));
    label.appendChild(cb);
    label.appendChild(document.createTextNode(' ' + (tool.label || tool.name)));
    return label;
  }

  _note(text) {
    const note = document.createElement('div');
    note.className = 'ai-chat-tools-note';
    note.textContent = text;
    return note;
  }
}
