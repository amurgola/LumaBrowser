class ElementDigest {
  static CAP_IN_VIEW = 60;
  static CAP_BELOW = 30;
  static CAP_BELOW_SCOPED = 150;

  static SCRIPT = ElementDigest.script();

  static script({ selector = null } = {}) {
    return `(function() {
  'use strict';
  try {
    var SCOPE = ${JSON.stringify(selector || null)};
    // Refs are per-observation: clear every stale tag before renumbering.
    document.querySelectorAll('[data-luma-ref]').forEach(function(el) {
      el.removeAttribute('data-luma-ref');
    });

    var SELECTOR = [
      'a[href]', 'button', 'input', 'select', 'textarea', 'summary',
      '[role="button"]', '[role="link"]', '[role="tab"]', '[role="menuitem"]',
      '[role="checkbox"]', '[role="radio"]', '[role="switch"]',
      '[role="combobox"]', '[role="searchbox"]', '[role="textbox"]',
      '[role="option"]', '[onclick]', '[contenteditable="true"]', '[contenteditable=""]', 'iframe',
    ].join(', ');

    // A rich-text editor is often a frame whose whole document is the editable area; type reaches into it.
    function isEditorFrame(el) {
      try {
        var doc = el.contentDocument;
        return !!doc && (doc.designMode === 'on' || !!(doc.body && doc.body.isContentEditable));
      } catch (_) { return false; }
    }

    function candidatesIn(scopes) {
      var found = [];
      for (var s = 0; s < scopes.length; s++) {
        if (scopes[s].matches(SELECTOR)) found.push(scopes[s]);
        var inner = scopes[s].querySelectorAll(SELECTOR);
        for (var c = 0; c < inner.length; c++) found.push(inner[c]);
      }
      return found;
    }

    var vw = window.innerWidth, vh = window.innerHeight;

    function labelFor(el) {
      var s = el.getAttribute('aria-label')
        || (el.labels && el.labels[0] && el.labels[0].textContent)
        || el.placeholder
        || ((el.tagName === 'INPUT' && (el.type === 'submit' || el.type === 'button')) ? el.value : '')
        || el.textContent
        || el.title
        || el.getAttribute('alt')
        || el.name
        || '';
      return String(s).trim().replace(/\\s+/g, ' ').slice(0, 80);
    }

    function roleFor(el) {
      var explicit = el.getAttribute('role');
      if (explicit) return explicit;
      var tag = el.tagName.toLowerCase();
      if (tag === 'a') return 'link';
      if (tag === 'iframe') return 'input:richtext';
      if (tag === 'input') {
        var t = (el.type || 'text').toLowerCase();
        if (t === 'submit' || t === 'button' || t === 'image') return 'button';
        return 'input:' + t;
      }
      if (tag === 'textarea') return 'input:textarea';
      if (tag === 'select') return 'select';
      return tag;
    }

    var candidates = document.querySelectorAll(SELECTOR);
    if (SCOPE) {
      var scopes = document.querySelectorAll(SCOPE);
      if (!scopes.length) return { success: false, error: 'No elements found for selector "' + SCOPE + '"' };
      candidates = candidatesIn(scopes);
    }
    var picked = [];
    var pickedSet = new Set();
    for (var i = 0; i < candidates.length; i++) {
      var el = candidates[i];
      if (pickedSet.has(el)) continue;
      if (el.tagName === 'IFRAME' && !isEditorFrame(el)) continue;
      if (el.disabled) continue;
      if (el.closest('[aria-hidden="true"]')) continue;
      var style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      var r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      picked.push({ el: el, rect: r });
      pickedSet.add(el);
    }

    // Drop elements nested inside another picked element (an <a> wrapping a
    // <button>, a [onclick] card containing its own link): one ref per
    // outermost interactive unit keeps the list clean; the inner target still
    // receives the click via hit-testing at the outer element's center only
    // when they overlap, so prefer keeping the OUTER one.
    var rows = [];
    for (var j = 0; j < picked.length; j++) {
      var p = picked[j].el.parentElement, nested = false;
      while (p) {
        if (pickedSet.has(p)) { nested = true; break; }
        p = p.parentElement;
      }
      if (!nested) rows.push(picked[j]);
    }

    var inVp = [], below = [];
    for (var k = 0; k < rows.length; k++) {
      var rr = rows[k].rect;
      var visible = rr.bottom > 0 && rr.top < vh && rr.right > 0 && rr.left < vw;
      (visible ? inVp : below).push(rows[k]);
    }

    var CAP_VP = ${ElementDigest.CAP_IN_VIEW}, CAP_BELOW = SCOPE ? ${ElementDigest.CAP_BELOW_SCOPED} : ${ElementDigest.CAP_BELOW};
    var n = 0;
    function tag(row) {
      n += 1;
      row.el.setAttribute('data-luma-ref', String(n));
      var b = row.rect;
      // Viewport CSS px [x, y, w, h] as measured this pass: what the
      // set-of-marks overlay draws and what click_at coordinates speak.
      return {
        ref: n, role: roleFor(row.el), label: labelFor(row.el),
        box: [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)],
      };
    }
    var viewport = inVp.slice(0, CAP_VP).map(tag);
    var belowOut = below.slice(0, CAP_BELOW).map(tag);
    var dropped = Math.max(0, inVp.length - CAP_VP) + Math.max(0, below.length - CAP_BELOW);

    var digest = {
      success: true,
      title: String(document.title || '').slice(0, 120),
      url: location.href,
      viewport: viewport,
      below: belowOut,
      dropped: dropped,
    };
    if (SCOPE) digest.scope = SCOPE;
    return digest;
  } catch (e) {
    return { success: false, error: e.message };
  }
})();`;
  }
}

module.exports = ElementDigest;
