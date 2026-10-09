(function installLumaExtUI() {
  if (typeof window === 'undefined' || window.LumaExtUI) return;

  const SVG_CHECK = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.5l2.5 2.5 4.5-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const SVG_CARET = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5l3.5 3.5 3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const SVG_MORE = '<svg viewBox="0 0 12 12" aria-hidden="true"><circle cx="2" cy="6" r="1.2" fill="currentColor"/><circle cx="6" cy="6" r="1.2" fill="currentColor"/><circle cx="10" cy="6" r="1.2" fill="currentColor"/></svg>';

  const INTERVAL_PRESETS = [
    { value: 60000, label: 'Every minute' },
    { value: 300000, label: 'Every 5 minutes' },
    { value: 900000, label: 'Every 15 minutes' },
    { value: 1800000, label: 'Every 30 minutes' },
    { value: 3600000, label: 'Every hour' },
    { value: 21600000, label: 'Every 6 hours' },
    { value: 43200000, label: 'Every 12 hours' },
    { value: 86400000, label: 'Every 24 hours' },
  ];

  function esc(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function alertDialog(message) {
    if (window.LumaModal && typeof window.LumaModal.alert === 'function') return window.LumaModal.alert(message);
    return Promise.resolve(window.alert(message));
  }

  function confirmDialog(message, opts) {
    if (window.LumaModal && typeof window.LumaModal.confirm === 'function') return window.LumaModal.confirm(message, opts);
    return Promise.resolve(!!window.confirm(message));
  }

  function flashSaved(anchor, text) {
    if (!anchor) return;
    let badge = anchor.nextElementSibling;
    if (!badge || !badge.classList || !badge.classList.contains('luma-saved')) {
      badge = document.createElement('span');
      badge.className = 'luma-saved';
      badge.innerHTML = SVG_CHECK + '<span></span>';
      anchor.insertAdjacentElement('afterend', badge);
    }
    badge.querySelector('span').textContent = text || 'Saved';
    badge.classList.add('is-on');
    clearTimeout(badge._t);
    badge._t = setTimeout(() => badge.classList.remove('is-on'), 1600);
  }

  function debounce(fn, ms) {
    let t = null;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  let openMenu = null;

  function closeMenu() {
    if (!openMenu) return;
    const { el, onDoc, onKey } = openMenu;
    document.removeEventListener('mousedown', onDoc, true);
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('resize', closeMenu);
    if (el.parentNode) el.parentNode.removeChild(el);
    openMenu = null;
  }

  function menu(anchor, items) {
    closeMenu();
    const el = document.createElement('div');
    el.className = 'luma-menu';
    el.setAttribute('role', 'menu');
    for (const item of items) {
      if (item.sep) {
        const sep = document.createElement('div');
        sep.className = 'luma-menu-sep';
        el.appendChild(sep);
        continue;
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'luma-menu-item' + (item.danger ? ' danger' : '');
      btn.textContent = item.label;
      btn.setAttribute('role', 'menuitem');
      if (item.disabled) btn.disabled = true;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeMenu();
        if (typeof item.onClick === 'function') item.onClick();
      });
      el.appendChild(btn);
    }
    document.body.appendChild(el);

    const r = anchor.getBoundingClientRect();
    const mw = el.offsetWidth;
    const mh = el.offsetHeight;
    let left = r.right - mw;
    let top = r.bottom + 4;
    if (left < 8) left = 8;
    if (top + mh > window.innerHeight - 8) top = Math.max(8, r.top - mh - 4);
    el.style.left = `${Math.round(left)}px`;
    el.style.top = `${Math.round(top)}px`;

    const onDoc = (e) => { if (!el.contains(e.target) && e.target !== anchor) closeMenu(); };
    const onKey = (e) => { if (e.key === 'Escape') closeMenu(); };
    document.addEventListener('mousedown', onDoc, true);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', closeMenu);
    openMenu = { el, onDoc, onKey };
    const first = el.querySelector('button:not([disabled])');
    if (first) first.focus();
    return el;
  }


  function intervalMarkup(id, selectedMs) {
    const sel = INTERVAL_PRESETS.some(p => p.value === selectedMs) ? selectedMs : (selectedMs ? 'custom' : 3600000);
    const opts = INTERVAL_PRESETS.map(p =>
      `<option value="${p.value}"${p.value === sel ? ' selected' : ''}>${esc(p.label)}</option>`).join('')
      + `<option value="custom"${sel === 'custom' ? ' selected' : ''}>Custom</option>`;
    return `<div class="luma-interval${sel === 'custom' ? ' is-custom' : ''}" id="${esc(id)}">`
      + `<select class="luma-field-select" id="${esc(id)}-select" aria-label="Interval">${opts}</select>`
      + `<span class="luma-interval-custom"><input type="number" class="luma-field-input" id="${esc(id)}-custom" min="1" step="1" value="${sel === 'custom' ? Math.max(1, Math.round(selectedMs / 60000)) : 10}" aria-label="Custom interval in minutes"><span>min</span></span>`
      + `</div>`;
  }

  function bindInterval(root) {
    if (!root) return { get: () => 3600000, set: () => {} };
    const select = root.querySelector('select');
    const custom = root.querySelector('input[type="number"]');
    const sync = () => root.classList.toggle('is-custom', select.value === 'custom');
    select.addEventListener('change', sync);
    sync();
    return {
      get() {
        if (select.value === 'custom') {
          const mins = Math.max(1, parseInt(custom.value, 10) || 1);
          return mins * 60000;
        }
        return parseInt(select.value, 10) || 3600000;
      },
      set(ms) {
        if (INTERVAL_PRESETS.some(p => p.value === ms)) {
          select.value = String(ms);
        } else {
          select.value = 'custom';
          custom.value = String(Math.max(1, Math.round((ms || 600000) / 60000)));
        }
        sync();
      },
    };
  }

  function formatInterval(ms) {
    const p = INTERVAL_PRESETS.find(x => x.value === ms);
    if (p) return p.label.replace(/^Every /, 'every ');
    if (!ms) return '';
    if (ms < 60000) return `every ${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `every ${Math.round(ms / 60000)} min`;
    const h = ms / 3600000;
    return `every ${Number.isInteger(h) ? h : h.toFixed(1)} h`;
  }

  function formatTime(iso) {
    if (!iso) return 'never';
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return String(iso);
      return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return String(iso); }
  }

  function formatRelative(iso) {
    if (!iso) return '';
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return '';
    const diff = t - Date.now();
    const abs = Math.abs(diff);
    const unit = abs < 60000 ? [Math.round(abs / 1000), 's']
      : abs < 3600000 ? [Math.round(abs / 60000), 'min']
      : abs < 86400000 ? [Math.round(abs / 3600000), 'h']
      : [Math.round(abs / 86400000), 'd'];
    return diff >= 0 ? `in ${unit[0]} ${unit[1]}` : `${unit[0]} ${unit[1]} ago`;
  }

  window.LumaExtUI = {
    ready: Promise.resolve(),
    esc,
    alert: alertDialog,
    confirm: confirmDialog,
    flashSaved,
    debounce,
    menu,
    closeMenu,
    intervalMarkup,
    bindInterval,
    formatInterval,
    formatTime,
    formatRelative,
    INTERVAL_PRESETS,
    icons: { check: SVG_CHECK, caret: SVG_CARET, more: SVG_MORE },
  };
})();
