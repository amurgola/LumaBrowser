import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';

export default class ToolGroupsView {
  static render(container, groups, onSet, opts = {}) {
    if (!container) return;
    const esc = opts.esc || HtmlEscaper.escape;
    const expanded = opts.expanded || (container._gsExpanded = container._gsExpanded || new Set());
    const list = Array.isArray(groups) ? groups : [];
    const draw = () => ToolGroupsView._draw(container, list, onSet, expanded, esc, opts.emptyText);
    ToolGroupsView._wireOnce(container);
    container._gsToolsState = { list, onSet, expanded, draw, onChange: opts.onChange };
    draw();
  }

  static _draw(container, list, onSet, expanded, esc, emptyText) {
    if (!list.length) {
      container.innerHTML = `<div class="luma-empty luma-empty--plain">${esc(emptyText || 'No tools available')}</div>`;
      return;
    }
    container.innerHTML = list.map((g) => ToolGroupsView._card(g, onSet, expanded.has(g.id), esc)).join('');
    container.querySelectorAll('input[data-gs-group][data-indeterminate="1"]').forEach((el) => { el.indeterminate = true; });
  }

  static _card(g, onSet, isOpen, esc) {
    const tools = Array.isArray(g.tools) ? g.tools : [];
    const names = tools.map((t) => t.name);
    const onCount = names.filter((n) => onSet.has(n)).length;
    const all = names.length > 0 && onCount === names.length;
    const none = onCount === 0;
    const allLocked = tools.length > 0 && tools.every((t) => t.locked);
    const detail = isOpen ? ToolGroupsView._detail(tools, onSet, esc) : '';
    return `
        <div class="gs-item-card" data-gs-group-card="${esc(g.id)}">
          <div style="display:flex;gap:8px;align-items:center;padding:8px 10px;">
            <input type="checkbox" data-gs-group="${esc(g.id)}" ${all ? 'checked' : ''} ${(!all && !none) ? 'data-indeterminate="1"' : ''} ${allLocked ? 'disabled title="Always on"' : 'title="Turn every tool in this group on or off"'}>
            <div style="flex:1;cursor:pointer;min-width:0;" data-gs-expand="${esc(g.id)}">
              <div style="font-size:12.5px;color:var(--text-primary);font-weight:600;">${esc(g.label || g.id)}</div>
              ${g.description ? `<div style="font-size:11px;color:var(--text-muted);">${esc(g.description)}</div>` : ''}
            </div>
            <span class="luma-badge ${none ? 'muted' : (all ? 'ok' : 'warn')}">${onCount}/${names.length}</span>
            <button type="button" class="gs-copy-btn" data-gs-expand="${esc(g.id)}">${isOpen ? 'Hide' : 'Customize'}</button>
          </div>
          ${detail}
        </div>`;
  }

  static _detail(tools, onSet, esc) {
    return `
        <div style="display:flex;flex-direction:column;gap:6px;padding:0 12px 10px 32px;">
          ${tools.map((t) => `
            <label class="luma-check" style="font-size:12px;color:var(--text-secondary);">
              <input type="checkbox" data-gs-tool="${esc(t.name)}" ${onSet.has(t.name) ? 'checked' : ''} ${t.locked ? 'disabled title="Always on"' : ''}>
              <span>${esc(t.label || t.name)}</span>
              <span class="gs-endpoint-desc" style="margin-left:auto;" title="${esc(t.hint != null ? t.hint : t.name)}">${esc(t.hint != null ? t.hint : t.name)}</span>
            </label>`).join('')}
        </div>`;
  }

  static _wireOnce(container) {
    if (container._gsToolsWired) return;
    container._gsToolsWired = true;
    container.addEventListener('change', (e) => ToolGroupsView._onChange(container, e));
    container.addEventListener('click', (e) => ToolGroupsView._onClick(container, e));
  }

  static _onChange(container, e) {
    const st = container._gsToolsState;
    if (!st) return;
    const groupId = e.target.getAttribute && e.target.getAttribute('data-gs-group');
    const toolName = e.target.getAttribute && e.target.getAttribute('data-gs-tool');
    if (groupId) {
      const g = st.list.find((x) => x.id === groupId);
      if (!g) return;
      for (const t of (g.tools || [])) {
        if (e.target.checked || t.locked) st.onSet.add(t.name); else st.onSet.delete(t.name);
      }
    } else if (toolName) {
      if (e.target.checked) st.onSet.add(toolName); else st.onSet.delete(toolName);
    } else {
      return;
    }
    st.draw();
    if (typeof st.onChange === 'function') st.onChange(st.onSet);
  }

  static _onClick(container, e) {
    const st = container._gsToolsState;
    if (!st) return;
    const t = e.target.closest && e.target.closest('[data-gs-expand]');
    if (!t) return;
    const id = t.getAttribute('data-gs-expand');
    if (st.expanded.has(id)) st.expanded.delete(id); else st.expanded.add(id);
    st.draw();
  }
}
