const SelectorKit = require('./extraction/SelectorKit');

class ResolutionCachePage {
  static PAGE_HELPERS_SRC = SelectorKit.HASHED_TOKEN_SRC + String.raw`
    var INTERACTIVE_SEL = 'a[href],button,input,select,textarea,summary,label,option,'
      + '[role="button"],[role="link"],[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"],'
      + '[role="tab"],[role="checkbox"],[role="radio"],[role="option"],[role="switch"],[role="combobox"],'
      + '[role="textbox"],[role="searchbox"],[role="treeitem"],[onclick],[contenteditable="true"],'
      + '[contenteditable=""],[tabindex]:not([tabindex="-1"])';
    var TEST_ATTRS = ['data-testid', 'data-test', 'data-test-id', 'data-qa', 'data-cy', 'data-automation-id'];
    function squash(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
    function textOf(el) {
      var tag = el.tagName;
      var t = el.getAttribute('aria-label') || '';
      if (!t && (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT')) {
        // An input's value is user data, not its identity: only buttons
        // named by their value count.
        var ty = (el.getAttribute('type') || '').toLowerCase();
        t = el.getAttribute('placeholder') || el.getAttribute('title')
          || ((ty === 'submit' || ty === 'button' || ty === 'reset') ? el.value : '')
          || el.getAttribute('name') || '';
      }
      if (!t) t = el.innerText || el.textContent || '';
      if (!t) t = el.getAttribute('title') || el.getAttribute('alt') || '';
      if (!t && el.querySelector) {
        var img = el.querySelector('img[alt]');
        if (img) t = img.getAttribute('alt') || '';
      }
      return squash(t).slice(0, 80);
    }
    function isVisible(el) {
      var r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      var cs = getComputedStyle(el);
      return cs.visibility !== 'hidden' && cs.display !== 'none';
    }
    function countOf(sel) { try { return document.querySelectorAll(sel).length; } catch (e) { return -1; } }
    // Quoted attribute values only need quote / backslash / newline escaped;
    // CSS.escape would also escape spaces and slashes, which is valid but
    // makes the stored selector unreadable in logs and payloads.
    function qv(v) { return String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\a '); }
    function attrSel(tag, name, v) { return tag + '[' + name + '="' + qv(v) + '"]'; }
    function stableClasses(el) {
      var out = [];
      var list = el.classList || [];
      for (var i = 0; i < list.length && out.length < 3; i++) {
        var c = list[i];
        // Build-tool hashes and counters change per deploy / per render.
        if (isHashedToken(c) || c.length > 40 || /\d{3,}/.test(c)) continue;
        if (!/^[A-Za-z_-][A-Za-z0-9_-]*$/.test(c)) continue;
        out.push(c);
      }
      return out;
    }
    function ownSelectors(el) {
      var tag = el.tagName.toLowerCase();
      var out = [];
      if (el.id && !isHashedToken(el.id) && !/\d{4,}/.test(el.id)) out.push('#' + CSS.escape(el.id));
      for (var i = 0; i < TEST_ATTRS.length; i++) {
        var tv = el.getAttribute(TEST_ATTRS[i]);
        if (tv) out.push('[' + TEST_ATTRS[i] + '="' + qv(tv) + '"]');
      }
      var al = el.getAttribute('aria-label');
      if (al) out.push(attrSel(tag, 'aria-label', al));
      var nm = el.getAttribute('name');
      if (nm) out.push(attrSel(tag, 'name', nm));
      var ph = el.getAttribute('placeholder');
      if (ph) out.push(attrSel(tag, 'placeholder', ph));
      var ti = el.getAttribute('title');
      if (ti) out.push(attrSel(tag, 'title', ti));
      if (tag === 'a') {
        var href = el.getAttribute('href');
        if (href && href.length < 160 && href.charAt(0) !== '#' && href.indexOf('javascript:') !== 0) out.push(attrSel(tag, 'href', href));
      }
      var cls = stableClasses(el);
      if (cls.length) out.push(tag + '.' + cls.map(function(c) { return CSS.escape(c); }).join('.'));
      return out;
    }
    function nthSeg(el) {
      var tag = el.tagName.toLowerCase();
      var cls = stableClasses(el);
      var seg = tag + (cls.length ? '.' + cls.map(function(c) { return CSS.escape(c); }).join('.') : '');
      var p = el.parentElement;
      if (!p) return seg;
      var same = 0, idx = 0;
      for (var c = p.firstElementChild; c; c = c.nextElementSibling) {
        if (c.tagName === el.tagName) { same++; if (c === el) idx = same; }
      }
      return same > 1 ? seg + ':nth-of-type(' + idx + ')' : seg;
    }
    /** Most human-authored unique selector for el, or null. */
    function robustSelector(el) {
      var own = ownSelectors(el);
      for (var i = 0; i < own.length; i++) if (countOf(own[i]) === 1) return own[i];
      // Anchor a short path on the nearest ancestor that is itself unique.
      var parts = [nthSeg(el)];
      var cur = el.parentElement;
      for (var depth = 0; cur && cur !== document.documentElement && depth < 8; depth++) {
        var anc = ownSelectors(cur);
        for (var j = 0; j < anc.length; j++) {
          if (countOf(anc[j]) !== 1) continue;
          var tail = parts.join(' > ');
          var viaOwn = own.length ? anc[j] + ' ' + own[0] : null;
          if (viaOwn && countOf(viaOwn) === 1) return viaOwn;
          var s = anc[j] + ' > ' + tail;
          if (countOf(s) === 1) return s;
          break;
        }
        parts.unshift(nthSeg(cur));
        cur = cur.parentElement;
      }
      var full = parts.join(' > ');
      return countOf(full) === 1 ? full : null;
    }
    function interactiveFrom(el) {
      var cur = el;
      for (var i = 0; cur && i < 8; i++) {
        if (cur === document.body || cur === document.documentElement) break;
        if (cur.matches && cur.matches(INTERACTIVE_SEL)) return cur;
        cur = cur.parentElement;
      }
      // Div soup: the outermost cursor:pointer box is the clickable one.
      cur = el;
      for (var k = 0; cur && k < 5; k++) {
        if (cur === document.body || cur === document.documentElement) break;
        var p = cur.parentElement;
        if (getComputedStyle(cur).cursor === 'pointer'
          && (!p || p === document.body || getComputedStyle(p).cursor !== 'pointer')) return cur;
        cur = p;
      }
      return el;
    }
    function describe(el) {
      var r = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role') || undefined,
        text: textOf(el),
        rect: [Math.round(r.left + scrollX), Math.round(r.top + scrollY), Math.round(r.width), Math.round(r.height)],
      };
    }
    function fold(s) { return squash(s).toLowerCase().replace(/\d+/g, '#'); }
    /** Loose text equality: counters (Cart (3) vs (4)) and small edits pass. */
    function similar(a, b) {
      a = fold(a); b = fold(b);
      if (a === b) return true;
      if (!a || !b) return false;
      var shorter = a.length < b.length ? a : b;
      var longer = a.length < b.length ? b : a;
      if (shorter.length >= 3 && longer.indexOf(shorter) !== -1) return true;
      var ta = a.split(/[^a-z0-9#]+/).filter(Boolean);
      var tb = b.split(/[^a-z0-9#]+/).filter(Boolean);
      if (!ta.length || !tb.length) return false;
      var inter = 0;
      for (var i = 0; i < ta.length; i++) if (tb.indexOf(ta[i]) !== -1) inter++;
      return inter / (ta.length + tb.length - inter) >= 0.5;
    }`;

  static UNCACHEABLE_TAGS = /^(IFRAME|FRAME|CANVAS|EMBED|OBJECT|VIDEO)$/;

  static captureAtPointScript(x, y) {
    return `(function() {
  try {${ResolutionCachePage.PAGE_HELPERS_SRC}
    var el = document.elementFromPoint(${Number(x)}, ${Number(y)});
    if (!el) return { success: false, error: 'nothing at point' };
    // Inside these the POINT matters, not the element: a selector cannot replay it.
    if (${ResolutionCachePage.UNCACHEABLE_TAGS}.test(el.tagName)) return { success: false, error: 'uncacheable ' + el.tagName };
    var t = interactiveFrom(el);
    if (t === document.body || t === document.documentElement) return { success: false, error: 'no element at point' };
    var r = t.getBoundingClientRect();
    if (r.width * r.height > 0.6 * innerWidth * innerHeight) return { success: false, error: 'target is a page-sized container' };
    var sel = robustSelector(t);
    if (!sel) return { success: false, error: 'no unique selector' };
    var d = describe(t);
    return { success: true, href: location.href, selector: sel, tag: d.tag, role: d.role, text: d.text, rect: d.rect };
  } catch (e) { return { success: false, error: e.message }; }
})()`;
  }

  static captureForSelectorScript(selector) {
    return `(function() {
  try {${ResolutionCachePage.PAGE_HELPERS_SRC}
    var SEL = ${JSON.stringify(String(selector || ''))};
    var els = Array.prototype.slice.call(document.querySelectorAll(SEL));
    if (!els.length) return { success: false, error: 'no match' };
    var vis = els.filter(isVisible);
    var t = vis[0] || els[0];
    var sel = robustSelector(t) || (els.length === 1 ? SEL : null);
    if (!sel) return { success: false, error: 'no unique selector' };
    var d = describe(t);
    return { success: true, href: location.href, selector: sel, tag: d.tag, role: d.role, text: d.text, rect: d.rect };
  } catch (e) { return { success: false, error: e.message }; }
})()`;
  }

  static validateScript(selector, hint, { pointCheck = true } = {}) {
    const h = { tag: (hint && hint.tag) || '', text: (hint && hint.text) || '' };
    return `(function() {
  try {${ResolutionCachePage.PAGE_HELPERS_SRC}
    var SEL = ${JSON.stringify(String(selector || ''))};
    var HINT = ${JSON.stringify(h)};
    var POINT = ${pointCheck ? 'true' : 'false'};
    var els;
    try { els = document.querySelectorAll(SEL); } catch (e) { return { success: true, ok: false, hard: true, reason: 'invalid selector' }; }
    if (!els.length) return { success: true, ok: false, hard: true, reason: 'no match' };
    var vis = Array.prototype.filter.call(els, isVisible);
    if (!vis.length) return { success: true, ok: false, hard: false, reason: 'not visible' };
    var cands = HINT.text ? vis.filter(function(e) { return similar(textOf(e), HINT.text); }) : vis;
    if (!cands.length) return { success: true, ok: false, hard: true, reason: 'text changed to "' + textOf(vis[0]) + '"' };
    if (cands.length > 1) return { success: true, ok: false, hard: true, reason: 'ambiguous (' + cands.length + ' matches)' };
    var t = cands[0];
    if (HINT.tag && t.tagName.toLowerCase() !== HINT.tag) return { success: true, ok: false, hard: true, reason: 'element type changed' };
    var r = t.getBoundingClientRect();
    if (POINT) {
      var inView = r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
      if (!inView) { try { t.scrollIntoView({ block: 'center', inline: 'center' }); } catch (e) {} r = t.getBoundingClientRect(); }
    }
    var x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2);
    if (POINT) {
      if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return { success: true, ok: false, hard: false, reason: 'off screen' };
      var at = document.elementFromPoint(x, y);
      if (!at || !(at === t || t.contains(at) || at.contains(t))) return { success: true, ok: false, hard: false, reason: 'covered by another element' };
    }
    return {
      success: true, ok: true,
      // exact: the selector's FIRST match is the validated one, so selector-
      // driven actions (querySelectorAll(...)[0]) act on the right node.
      exact: els.length === 1 || els[0] === t,
      x: x, y: y,
      bbox: [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)],
      target: { tagName: t.tagName, id: t.id || undefined, role: t.getAttribute('role') || undefined, text: textOf(t) },
    };
  } catch (e) { return { success: false, error: e.message }; }
})()`;
  }
}

module.exports = ResolutionCachePage;
