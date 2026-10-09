(function() {
  return new Promise(function(resolve) {
    var existing = (window.__pcdInitialSelectors && Array.isArray(window.__pcdInitialSelectors))
      ? window.__pcdInitialSelectors.slice() : [];

    var SELECTORS = [];
    var SELECTED = new Map();
    var lastHover = null;
    var DONE_BTN_ID = '__pcd_done';
    var CANCEL_BTN_ID = '__pcd_cancel';
    var COUNT_ID = '__pcd_count';
    var BANNER_ID = '__pcd_banner';

    function escClass(c) {
      try { return CSS.escape(c); } catch (_) { return c.replace(/[^a-zA-Z0-9_-]/g, '\\$&'); }
    }

    function buildSelector(el) {
      if (!el || el.nodeType !== 1) return null;
      if (el.id) return '#' + escClass(el.id);

      var path = [];
      var cur = el;
      var depth = 0;
      while (cur && cur.nodeType === 1 && cur !== document.body && depth < 6) {
        var seg = cur.tagName.toLowerCase();
        if (cur.id) { path.unshift('#' + escClass(cur.id)); break; }
        if (cur.className && typeof cur.className === 'string') {
          var classes = cur.className.trim().split(/\s+/)
            .filter(function(c) { return c && !/^[0-9]/.test(c); })
            .slice(0, 3);
          if (classes.length) seg += '.' + classes.map(escClass).join('.');
        }
        var parent = cur.parentNode;
        if (parent && parent.children) {
          var sibs = Array.from(parent.children).filter(function(s) { return s.tagName === cur.tagName; });
          if (sibs.length > 1) {
            seg += ':nth-of-type(' + (sibs.indexOf(cur) + 1) + ')';
          }
        }
        path.unshift(seg);
        cur = cur.parentNode;
        depth++;
      }
      return path.join(' > ');
    }

    function applyOutline(el, color, persistent) {
      if (!el || !el.style) return;
      if (persistent) {
        el.setAttribute('data-pcd-selected', '1');
      }
      el.style.outline = '2px solid ' + color;
      el.style.outlineOffset = '1px';
    }
    function clearOutline(el) {
      if (!el || !el.style) return;
      el.style.outline = '';
      el.style.outlineOffset = '';
      el.removeAttribute('data-pcd-selected');
    }

    var banner = document.createElement('div');
    banner.id = BANNER_ID;
    banner.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0',
      'z-index:2147483647',
      'background:#0b1220', 'color:#eef2ff',
      'font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'padding:10px 16px',
      'display:flex', 'align-items:center', 'gap:14px',
      'box-shadow:0 4px 16px rgba(0,0,0,.5)',
      'border-bottom:2px solid #f59034'
    ].join(';');
    banner.innerHTML =
      '<span style="font-weight:600;letter-spacing:.04em;color:#f59034;">PAGE CHANGE DETECTOR</span>' +
      '<span id="' + COUNT_ID + '" style="opacity:.85;font-size:12px;font-family:monospace;">0 elements</span>' +
      '<span style="flex:1;text-align:right;opacity:.55;font-size:11px;">click to add · click again to remove · ESC = done</span>' +
      '<button id="' + DONE_BTN_ID + '" type="button" style="background:#f59034;color:#0b1220;border:none;padding:6px 16px;border-radius:4px;font-weight:600;cursor:pointer;font-size:12px;">Done</button>' +
      '<button id="' + CANCEL_BTN_ID + '" type="button" style="background:transparent;color:#eef2ff;border:1px solid rgba(255,255,255,.2);padding:6px 14px;border-radius:4px;cursor:pointer;font-size:12px;">Cancel</button>';
    document.documentElement.appendChild(banner);

    existing.forEach(function(sel) {
      try {
        var el = document.querySelector(sel);
        if (el) {
          SELECTORS.push(sel);
          SELECTED.set(sel, el);
          applyOutline(el, '#22c55e', true);
        }
      } catch (_) {}
    });

    function updateCount() {
      var el = document.getElementById(COUNT_ID);
      if (el) el.textContent = SELECTORS.length + ' element' + (SELECTORS.length === 1 ? '' : 's');
    }
    updateCount();

    function isInBanner(target) {
      return banner && (target === banner || banner.contains(target));
    }

    function teardown(result) {
      document.removeEventListener('mouseover', onMove, true);
      document.removeEventListener('mouseout', onOut, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKey, true);
      if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
      SELECTED.forEach(function(e) { clearOutline(e); });
      if (lastHover && !SELECTED.has(buildSelector(lastHover))) clearOutline(lastHover);
      Array.prototype.forEach.call(
        document.querySelectorAll('[data-pcd-selected]'),
        function(e) { clearOutline(e); }
      );
      try { delete window.__pcdInitialSelectors; } catch (_) {}
      resolve(result);
    }

    function onMove(e) {
      if (isInBanner(e.target)) return;
      if (lastHover && lastHover !== e.target) {
        var prevSel = buildSelector(lastHover);
        if (!SELECTED.has(prevSel)) clearOutline(lastHover);
      }
      lastHover = e.target;
      var sel = buildSelector(lastHover);
      if (!SELECTED.has(sel)) applyOutline(lastHover, '#f59034', false);
    }

    function onOut(e) {
      if (!e.target || isInBanner(e.target)) return;
      var sel = buildSelector(e.target);
      if (!SELECTED.has(sel)) clearOutline(e.target);
    }

    function onClick(e) {
      if (isInBanner(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      var target = e.target;
      var sel = buildSelector(target);
      if (!sel) return;
      if (SELECTED.has(sel)) {
        SELECTED.delete(sel);
        SELECTORS = SELECTORS.filter(function(s) { return s !== sel; });
        clearOutline(target);
      } else {
        SELECTORS.push(sel);
        SELECTED.set(sel, target);
        applyOutline(target, '#22c55e', true);
      }
      updateCount();
    }

    function onKey(e) {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        teardown(SELECTORS.slice());
      }
    }

    document.addEventListener('mouseover', onMove, true);
    document.addEventListener('mouseout', onOut, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKey, true);

    document.getElementById(DONE_BTN_ID).addEventListener('click', function(e) {
      e.preventDefault(); e.stopPropagation();
      teardown(SELECTORS.slice());
    });
    document.getElementById(CANCEL_BTN_ID).addEventListener('click', function(e) {
      e.preventDefault(); e.stopPropagation();
      teardown(null);
    });
  });
})()
