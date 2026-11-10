export default class PaletteHtml {
  static ICONS = {
    setting: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
    page: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>',
    conversation: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    artifact: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    tab: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8h20"/><path d="M6 4v4"/>',
    action: '<path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/>',
    dig: '<path d="M21 6H3"/><path d="M10 12H3"/><path d="M10 18H3"/><circle cx="17" cy="15" r="3"/><path d="m21 19-1.9-1.9"/>',
  };

  static esc(text) {
    return String(text == null ? '' : text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  static marked(text, marks) {
    const s = String(text == null ? '' : text);
    const ranges = (Array.isArray(marks) ? marks : [])
      .filter((r) => Array.isArray(r) && r[0] >= 0 && r[1] > r[0] && r[1] <= s.length)
      .sort((a, b) => a[0] - b[0]);
    let out = '';
    let at = 0;
    for (const [start, end] of ranges) {
      if (start < at) continue;
      out += PaletteHtml.esc(s.slice(at, start)) + '<mark>' + PaletteHtml.esc(s.slice(start, end)) + '</mark>';
      at = end;
    }
    return out + PaletteHtml.esc(s.slice(at));
  }

  static icon(item) {
    let key = item.kind;
    if (item.kind === 'setting' && (item.settingKind === 'page' || item.settingKind === 'section')) key = 'page';
    if (item.kind === 'settings' || item.kind === 'setup') key = 'page';
    if (item.kind === 'artifact' && item.data && (item.data.type === 'image' || item.data.type === 'video')) key = 'image';
    const paths = PaletteHtml.ICONS[key] || PaletteHtml.ICONS.page;
    return `<span class="pal-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${paths}</svg></span>`;
  }

  static list(groups, { query = '', canDig = false } = {}) {
    let index = 0;
    let html = '';
    for (const g of groups || []) {
      html += `<div class="pal-group-label">${PaletteHtml.esc(g.label)}</div>`;
      for (const item of g.items || []) html += PaletteHtml.row(item, index++);
    }
    if (!index) html += PaletteHtml.empty(query);
    if (canDig) html += PaletteHtml.digRow(query, index);
    return html;
  }

  static row(item, index) {
    const value = item.value ? `<span class="pal-value" title="Current value">${PaletteHtml.esc(item.value)}</span>` : '';
    const right = item.hint
      ? `<span class="pal-hint">${PaletteHtml.keys(item.hint)}</span>`
      : (value || (item.tag ? `<span class="pal-tag">${PaletteHtml.esc(item.tag)}</span>` : ''));
    const sub = item.subtitle ? `<div class="pal-sub">${PaletteHtml.marked(item.subtitle, item.subtitleMarks)}</div>` : '';
    return `<div class="pal-row" role="option" id="pal-row-${index}" data-index="${index}">${PaletteHtml.icon(item)}`
      + `<div class="pal-text"><div class="pal-title">${PaletteHtml.marked(item.title, item.marks)}</div>${sub}</div>${right}</div>`;
  }

  static digRow(query, index) {
    return `<div class="pal-group-label">Not what you meant?</div>`
      + `<div class="pal-row pal-dig-row" role="option" id="pal-row-${index}" data-index="${index}" data-dig="1">`
      + `${PaletteHtml.icon({ kind: 'dig' })}<div class="pal-text"><div class="pal-title">Dig deeper: ask about <strong>${PaletteHtml.esc(query)}</strong></div>`
      + '<div class="pal-sub">Searches your settings, chats and the LumaBrowser docs with your model</div></div>'
      + `<span class="pal-hint">${PaletteHtml.keys('Tab')}</span></div>`;
  }

  static empty(query) {
    return query
      ? `<div class="pal-empty">Nothing matches "${PaletteHtml.esc(query)}".</div>`
      : '<div class="pal-empty">Type to search settings, chats, artifacts, open tabs and commands.</div>';
  }

  static keys(combo) {
    return String(combo).split('+').map((k) => `<kbd>${PaletteHtml.esc(k)}</kbd>`).join('');
  }
}
