export default class OverflowMenu {
  static _open = null;

  static open(anchor, items) {
    OverflowMenu.close();
    const el = OverflowMenu._build(items);
    document.body.appendChild(el);
    OverflowMenu._position(el, anchor);
    OverflowMenu._listen(el, anchor);
    const first = el.querySelector('button:not([disabled])');
    if (first) first.focus();
    return el;
  }

  static close() {
    if (!OverflowMenu._open) return;
    const { el, onDoc, onKey } = OverflowMenu._open;
    document.removeEventListener('mousedown', onDoc, true);
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('resize', OverflowMenu.close);
    if (el.parentNode) el.parentNode.removeChild(el);
    OverflowMenu._open = null;
  }

  static _build(items) {
    const el = document.createElement('div');
    el.className = 'luma-menu';
    el.setAttribute('role', 'menu');
    for (const item of items) el.appendChild(item.sep ? OverflowMenu._separator() : OverflowMenu._item(item));
    return el;
  }

  static _separator() {
    const sep = document.createElement('div');
    sep.className = 'luma-menu-sep';
    return sep;
  }

  static _item(item) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'luma-menu-item' + (item.danger ? ' danger' : '');
    btn.textContent = item.label;
    btn.setAttribute('role', 'menuitem');
    if (item.disabled) btn.disabled = true;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      OverflowMenu.close();
      if (typeof item.onClick === 'function') item.onClick();
    });
    return btn;
  }

  static _position(el, anchor) {
    const r = anchor.getBoundingClientRect();
    const mw = el.offsetWidth;
    const mh = el.offsetHeight;
    let left = r.right - mw;
    let top = r.bottom + 4;
    if (left < 8) left = 8;
    if (top + mh > window.innerHeight - 8) top = Math.max(8, r.top - mh - 4);
    el.style.left = `${Math.round(left)}px`;
    el.style.top = `${Math.round(top)}px`;
  }

  static _listen(el, anchor) {
    const onDoc = (e) => { if (!el.contains(e.target) && e.target !== anchor) OverflowMenu.close(); };
    const onKey = (e) => { if (e.key === 'Escape') OverflowMenu.close(); };
    document.addEventListener('mousedown', onDoc, true);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', OverflowMenu.close);
    OverflowMenu._open = { el, onDoc, onKey };
  }
}
