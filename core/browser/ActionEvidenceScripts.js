class ActionEvidenceScripts {
  static EVIDENCE_TARGET_ATTR = 'data-luma-evidence-target';

  static SETTLE_KEY = '__lumaSettle_v1';

  static FINGERPRINT_FN_SRC = `
function __lumaFp() {
  var d = document, b = d.body;
  function h(s, x) { x = x || 5381; for (var i = 0; i < s.length; i++) { x = ((x << 5) + x + s.charCodeAt(i)) | 0; } return x >>> 0; }
  function box(el) { try { var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; } catch (_) { return false; } }
  function shown(el) {
    if (!box(el)) return false;
    try { var cs = getComputedStyle(el); return cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) !== 0; } catch (_) { return true; }
  }
  function lab(el) {
    if (!el || !el.getAttribute) return '';
    var s = el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.getAttribute('title')
      || el.getAttribute('alt') || el.innerText || el.getAttribute('name') || el.id || '';
    return String(s).trim().replace(/\\s+/g, ' ').slice(0, 40);
  }
  function desc(el) {
    if (!el || el === b || el === d.documentElement || !el.tagName) return null;
    var t = el.tagName.toLowerCase();
    var role = el.getAttribute && el.getAttribute('role');
    if (t === 'input') t = 'input' + (el.type && el.type !== 'text' ? '[' + el.type + ']' : '');
    else if (role) t = role;
    else if (el.isContentEditable) t = 'textbox';
    return { kind: t, label: lab(el) };
  }
  var text = '';
  try { text = b ? (b.innerText || '') : ''; } catch (_) {}
  var inter = d.querySelectorAll('a[href],button,input,select,textarea,summary,[role=button],[role=link],[role=tab],[role=menuitem],[role=option],[role=checkbox],[role=switch],[contenteditable=true]');
  var iCount = 0, iHash = 5381, lim = Math.min(inter.length, 400);
  for (var i = 0; i < lim; i++) { if (!box(inter[i])) continue; iCount++; iHash = h(lab(inter[i]) + '|', iHash); }
  var dl = d.querySelectorAll('dialog[open],[role=dialog],[role=alertdialog],[aria-modal=true]');
  var dialogs = 0, dialogLabel = '';
  for (var j = 0; j < dl.length && j < 20; j++) {
    var dg = dl[j];
    if (dg.getAttribute('aria-hidden') === 'true' || !shown(dg)) continue;
    dialogs++;
    if (!dialogLabel) {
      var by = dg.getAttribute('aria-labelledby');
      var byEl = by ? d.getElementById(by.split(' ')[0]) : null;
      var hd = dg.querySelector('h1,h2,h3,h4,[role=heading]');
      dialogLabel = String(dg.getAttribute('aria-label') || (byEl && byEl.innerText) || (hd && hd.innerText) || dg.innerText || '')
        .trim().replace(/\\s+/g, ' ').slice(0, 60);
    }
  }
  var t = d.querySelector('[${ActionEvidenceScripts.EVIDENCE_TARGET_ATTR}]');
  var target = null;
  if (t) {
    var val = null;
    if (typeof t.value === 'string' && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) val = t.value.slice(0, 200);
    else if (t.isContentEditable) val = String(t.innerText || '').slice(0, 200);
    target = {
      label: lab(t),
      value: val,
      checked: typeof t.checked === 'boolean' ? t.checked : null,
      expanded: t.getAttribute('aria-expanded'),
      selected: t.getAttribute('aria-selected'),
      pressed: t.getAttribute('aria-pressed'),
      visible: box(t),
    };
  }
  var se = d.scrollingElement || d.documentElement;
  return {
    __lumaFp: 1,
    url: location.href,
    title: d.title || '',
    sx: Math.round(window.scrollX || (se && se.scrollLeft) || 0),
    sy: Math.round(window.scrollY || (se && se.scrollTop) || 0),
    nodes: d.getElementsByTagName('*').length,
    textLen: text.length,
    textHash: h(text),
    iCount: iCount,
    iHash: iHash,
    dialogs: dialogs,
    dialogLabel: dialogLabel,
    active: desc(d.activeElement),
    activeIsTarget: !!(t && d.activeElement && (d.activeElement === t || t.contains(d.activeElement))),
    hadTarget: !!t,
    target: target,
  };
}`;

  static SETTLE_INSTALL_SRC = `
(function() {
  try {
    var old = window['${ActionEvidenceScripts.SETTLE_KEY}'];
    if (old) { try { old.mo.disconnect(); } catch (_) {} try { window.removeEventListener('scroll', old.onScroll, true); } catch (_) {} }
    var s = { last: Date.now(), m: 0, rc: 0, mo: null, onScroll: null };
    try { s.rc = performance.getEntriesByType('resource').length; } catch (_) {}
    s.mo = new MutationObserver(function(recs) {
      for (var i = 0; i < recs.length; i++) {
        var r = recs[i];
        if (r.type === 'attributes' && r.attributeName && r.attributeName.indexOf('data-luma-') === 0) continue;
        s.m++; s.last = Date.now(); return;
      }
    });
    s.mo.observe(document.documentElement || document, { subtree: true, childList: true, attributes: true, characterData: true });
    s.onScroll = function() { s.last = Date.now(); };
    window.addEventListener('scroll', s.onScroll, true);
    Object.defineProperty(window, '${ActionEvidenceScripts.SETTLE_KEY}', { value: s, configurable: true, enumerable: false, writable: true });
  } catch (_) {}
})();`;

  static beforeExpr(targetExpr) {
    const attr = ActionEvidenceScripts.EVIDENCE_TARGET_ATTR;
    return `(function(__t) {
  ${ActionEvidenceScripts.FINGERPRINT_FN_SRC}
  try {
    var olds = document.querySelectorAll('[${attr}]');
    for (var i = 0; i < olds.length; i++) olds[i].removeAttribute('${attr}');
    if (__t && __t.setAttribute) __t.setAttribute('${attr}', '1');
    ${ActionEvidenceScripts.SETTLE_INSTALL_SRC}
    return __lumaFp();
  } catch (e) { return null; }
})(${targetExpr || 'null'})`;
  }

  static beforeScript(targetExpr) {
    return `/*luma:evidence-before*/ ${ActionEvidenceScripts.beforeExpr(targetExpr)}`;
  }

  static pollScript() {
    return `/*luma:settle-poll*/ (function() {
  var s = window['${ActionEvidenceScripts.SETTLE_KEY}'];
  if (!s) return { installed: false };
  try { var rc = performance.getEntriesByType('resource').length; if (rc !== s.rc) { s.rc = rc; s.last = Date.now(); } } catch (_) {}
  return { installed: true, age: Date.now() - s.last, mutations: s.m };
})()`;
  }

  static installScript() {
    return `/*luma:settle-install*/ ${ActionEvidenceScripts.SETTLE_INSTALL_SRC} true;`;
  }

  static finalScript({ fingerprint = true } = {}) {
    const key = ActionEvidenceScripts.SETTLE_KEY;
    const attr = ActionEvidenceScripts.EVIDENCE_TARGET_ATTR;
    return `/*luma:settle-final*/ (function() {
  ${ActionEvidenceScripts.FINGERPRINT_FN_SRC}
  var out = null;
  try {
    if (${fingerprint ? 'true' : 'false'}) out = __lumaFp();
  } catch (_) {}
  try {
    var s = window['${key}'];
    if (s) { try { s.mo.disconnect(); } catch (_) {} try { window.removeEventListener('scroll', s.onScroll, true); } catch (_) {} delete window['${key}']; }
    var ts = document.querySelectorAll('[${attr}]');
    for (var i = 0; i < ts.length; i++) ts[i].removeAttribute('${attr}');
  } catch (_) {}
  return out;
})()`;
  }
}

module.exports = ActionEvidenceScripts;
