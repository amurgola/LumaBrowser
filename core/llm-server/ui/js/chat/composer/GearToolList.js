import ChatIcons from '../ChatIcons.js';
import Dom from '../../dom/Dom.js';
import HtmlEscaper from '../../format/HtmlEscaper.js';

export default class GearToolList {
  constructor(ctx) {
    this._ctx = ctx;
  }

  async render(container) {
    const { state, api } = this._ctx;
    if (!state.toolCatalog) container.innerHTML = '<div class="cm-gear-note">Loading tools…</div>';
    try {
      const r = await api.chat.agentTools();
      if (r && r.success) state.toolCatalog = { groups: r.groups || [], disabled: r.disabled || [] };
    } catch (_) {}
    if (!state.toolCatalog) {
      container.innerHTML = '<div class="cm-gear-note">Tools aren’t available yet.</div>';
      return;
    }
    if (!container.isConnected) return;
    this._renderList(container);
    this._ctx.gear.fit();
  }

  setToolDisabled(name, disabled, opts) {
    const { state } = this._ctx;
    const set = new Set(state.disabledTools);
    if (disabled) set.add(name); else set.delete(name);
    state.disabledTools = [...set];
    if (!(opts && opts.defer)) this.persist();
  }

  persist() {
    const { api, state } = this._ctx;
    if (state.activeId && api.conv && api.conv.setDisabledTools) {
      try { api.conv.setDisabledTools(state.activeId, state.disabledTools); } catch (_) {}
    }
  }

  _renderList(container) {
    const globallyOff = new Set(this._ctx.state.toolCatalog.disabled);
    container.innerHTML = '';
    for (const g of this._ctx.state.toolCatalog.groups) {
      const tools = (g.tools || []).filter((t) => !globallyOff.has(t.name) || t.surfaceWhenDisabled);
      if (tools.length) this._renderGroup(container, g, tools, globallyOff);
    }
  }

  _renderGroup(container, g, tools, globallyOff) {
    const head = Dom.el('div', 'cm-gear-group');
    if (g.description) head.title = g.description;
    const gcb = document.createElement('input');
    gcb.type = 'checkbox';
    head.appendChild(gcb);
    head.appendChild(Dom.el('span', 'cm-gear-group-label', HtmlEscaper.escape(g.label)));
    const count = Dom.el('span', 'cm-gear-group-count');
    head.appendChild(count);
    head.appendChild(Dom.el('span', 'cm-gear-group-caret', ChatIcons.chevron));
    container.appendChild(head);
    const rows = Dom.el('div', 'cm-gear-group-tools');
    rows.hidden = true;
    container.appendChild(rows);
    head.addEventListener('click', (e) => {
      if (e.target === gcb) return;
      rows.hidden = !rows.hidden;
      head.classList.toggle('open', !rows.hidden);
      this._ctx.gear.fit();
    });
    const group = { gcb, count, rows, tools, globallyOff };
    for (const t of tools) rows.appendChild(this._toolRow(t, group));
    gcb.addEventListener('change', () => this._toggleGroup(group));
    this._syncGroupBox(group);
  }

  _toolRow(t, group) {
    const row = Dom.el('label', 'cm-gear-tool');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = this._isOn(t, group.globallyOff);
    cb.addEventListener('change', () => {
      if (cb.checked) this._enableTool(t, group.globallyOff); else this.setToolDisabled(t.name, true, { defer: true });
      this.persist();
      this._syncGroupBox(group);
    });
    row.appendChild(cb);
    row.appendChild(Dom.el('span', null, HtmlEscaper.escape(t.label || t.name)));
    return row;
  }

  _toggleGroup(group) {
    const enable = group.gcb.checked;
    group.gcb.indeterminate = false;
    group.rows.querySelectorAll('input').forEach((cb) => { cb.checked = enable; });
    for (const t of group.tools) {
      if (enable) this._enableTool(t, group.globallyOff); else this.setToolDisabled(t.name, true, { defer: true });
    }
    this.persist();
    this._syncGroupBox(group);
  }

  _isOn(t, globallyOff) {
    return !globallyOff.has(t.name) && !this._ctx.state.disabledTools.includes(t.name);
  }

  _syncGroupBox(group) {
    const on = group.tools.filter((t) => this._isOn(t, group.globallyOff)).length;
    group.gcb.checked = on === group.tools.length;
    group.gcb.indeterminate = on > 0 && on < group.tools.length;
    group.count.textContent = on + '/' + group.tools.length;
  }

  _enableTool(t, globallyOff) {
    const { state, api } = this._ctx;
    if (globallyOff.has(t.name)) {
      globallyOff.delete(t.name);
      state.toolCatalog.disabled = state.toolCatalog.disabled.filter((n) => n !== t.name);
      try { if (api.chat.setGlobalToolEnabled) api.chat.setGlobalToolEnabled(t.name, true); } catch (_) {}
    }
    this.setToolDisabled(t.name, false, { defer: true });
  }
}
