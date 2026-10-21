function readerProbe(kind, description, childSelectors) {
  var MAX_ELEMENTS = 6000;
  var MAX_CANDIDATES = 40;
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEMPLATE: 1, HEAD: 1, META: 1, LINK: 1, TITLE: 1 };
  var norm = function (s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().toLowerCase(); };
  var rawText = function (el) { return String((el.innerText != null ? el.innerText : el.textContent) || '').replace(/\s+/g, ' ').trim(); };
  var textOf = function (el) { return norm(rawText(el)); };
  var esc = function (s) {
    if (window.CSS && typeof CSS.escape === 'function') return CSS.escape(s);
    return String(s).replace(/([^a-zA-Z0-9_-])/g, '\\$1');
  };
  var matches = function (sel) { try { return Array.prototype.slice.call(document.querySelectorAll(sel)); } catch (e) { return null; } };
  var unique = function (sel, el) { var m = matches(sel); return !!m && m.length === 1 && m[0] === el; };
  var idSel = function (el) { return el.id && unique('#' + esc(el.id), el) ? '#' + esc(el.id) : null; };
  var classesOf = function (el) { return typeof el.className === 'string' ? el.className.split(/\s+/).filter(Boolean).sort() : []; };
  var selectorFor = function (el) {
    var own = idSel(el);
    if (own) return own;
    var testId = el.getAttribute ? el.getAttribute('data-testid') : null;
    if (testId && unique('[data-testid="' + testId.replace(/"/g, '\\"') + '"]', el)) return '[data-testid="' + testId.replace(/"/g, '\\"') + '"]';
    var parts = [];
    var cur = el;
    while (cur && cur.nodeType === 1 && cur !== document.body) {
      var anchor = cur !== el ? idSel(cur) : null;
      if (anchor) { parts.unshift(anchor); break; }
      var parent = cur.parentElement;
      var tag = cur.tagName.toLowerCase();
      var same = parent ? Array.prototype.filter.call(parent.children, function (c) { return c.tagName === cur.tagName; }) : [cur];
      parts.unshift(same.length > 1 ? tag + ':nth-of-type(' + (same.indexOf(cur) + 1) + ')' : tag);
      cur = parent;
    }
    if (!parts.length || parts[0].charAt(0) !== '#') parts.unshift('body');
    var sel = parts.join(' > ');
    return unique(sel, el) ? sel : null;
  };
  var candidate = function (el, sel, extra) {
    var out = { selector: sel, tag: el.tagName.toLowerCase(), id: el.id || null, classes: classesOf(el), text: rawText(el).slice(0, 60) };
    for (var key in extra) if (Object.prototype.hasOwnProperty.call(extra, key)) out[key] = extra[key];
    return out;
  };
  var deepest = function (list) { return list.filter(function (el) { return !list.some(function (o) { return o !== el && el.contains(o); }); }); };
  var want = norm(description);
  var all = document.body ? Array.prototype.slice.call(document.body.querySelectorAll('*'), 0, MAX_ELEMENTS) : [];
  var elements = all.filter(function (el) { return !SKIP[el.tagName]; });
  var out = { success: true, kind: kind, match: null, candidates: [] };

  var findByText = function () {
    if (!want) return;
    var withText = [];
    elements.forEach(function (el) { var t = textOf(el); if (t) withText.push({ el: el, text: t }); });
    var exact = deepest(withText.filter(function (x) { return x.text === want; }).map(function (x) { return x.el; }));
    var starts = deepest(withText.filter(function (x) { return x.text !== want && x.text.indexOf(want) === 0; }).map(function (x) { return x.el; }));
    var contains = deepest(withText.filter(function (x) { return x.text.indexOf(want) > 0; }).map(function (x) { return x.el; }));
    var chosen = null;
    var rank = { exact: 0, starts: 1, contains: 2 };
    if (exact.length) chosen = exact.slice().sort(function (a, b) { return a.querySelectorAll('*').length - b.querySelectorAll('*').length; })[0];
    else if (starts.length === 1) chosen = starts[0];
    else if (contains.length === 1) chosen = contains[0];
    [['exact', exact], ['starts', starts], ['contains', contains]].forEach(function (pair) {
      pair[1].forEach(function (el) {
        if (out.candidates.length >= MAX_CANDIDATES) return;
        var sel = selectorFor(el);
        if (sel) out.candidates.push(candidate(el, sel, { match: pair[0], rank: rank[pair[0]] }));
      });
    });
    if (chosen) { var sel = selectorFor(chosen); if (sel) out.match = { selector: sel, text: rawText(chosen).slice(0, 60), strategy: 'text' }; }
  };

  var findGroups = function (sels, requireChildren) {
    var byParent = [];
    var index = {};
    elements.forEach(function (el) {
      var parent = el.parentElement;
      if (!parent) return;
      var key = el.tagName + '|' + classesOf(el).join('.');
      var pid = byParent.indexOf(parent);
      if (pid < 0) { pid = byParent.push(parent) - 1; index[pid] = {}; }
      (index[pid][key] = index[pid][key] || []).push(el);
    });
    var childOk = function (m) { return sels.every(function (sel) { try { return !!m.querySelector(sel); } catch (e) { return false; } }); };
    var groups = [];
    byParent.forEach(function (parent, pid) {
      Object.keys(index[pid]).forEach(function (key) {
        var members = index[pid][key];
        if (members.length < 2) return;
        var matching = sels.length ? members.filter(childOk).length : members.length;
        if (requireChildren && matching === 0) return;
        var parentSel = parent === document.body ? 'body' : selectorFor(parent);
        if (!parentSel) return;
        var first = members[0];
        var sel = parentSel + ' > ' + first.tagName.toLowerCase() + classesOf(first).map(function (c) { return '.' + esc(c); }).join('');
        var found = matches(sel);
        if (!found || found.length !== members.length || !members.every(function (m) { return found.indexOf(m) >= 0; })) return;
        var descHit = !!want && members.some(function (m) { return textOf(m).indexOf(want) >= 0; });
        var score = matching * 10 + (descHit ? 5 : 0) + (matching === members.length ? 1 : 0);
        groups.push(candidate(first, sel, { count: members.length, matching: matching, descHit: descHit, score: score }));
      });
    });
    groups.sort(function (a, b) { return b.score - a.score || b.count - a.count; });
    return groups;
  };

  var findRows = function () {
    var sels = [];
    var map = childSelectors && typeof childSelectors === 'object' ? childSelectors : {};
    Object.keys(map).forEach(function (k) { if (map[k]) sels.push(String(map[k])); });
    var groups = findGroups(sels, sels.length > 0);
    out.candidates = groups.slice(0, MAX_CANDIDATES);
    var best = groups[0];
    if (best && (sels.length ? best.matching >= 1 : (best.descHit || groups.length === 1))) out.match = { selector: best.selector, text: best.text, strategy: 'rows' };
  };

  var findTable = function () {
    var tables = Array.prototype.slice.call(document.querySelectorAll('table'));
    var listed = [];
    tables.forEach(function (t) {
      var sel = selectorFor(t);
      if (sel) listed.push(candidate(t, sel, { rows: t.querySelectorAll('tr').length, descHit: !!want && textOf(t).indexOf(want) >= 0 }));
    });
    var hits = listed.filter(function (c) { return c.descHit; });
    var chosen = hits.length ? hits[0] : (listed.length === 1 ? listed[0] : null);
    out.candidates = listed.slice(0, MAX_CANDIDATES);
    if (chosen) { out.match = { selector: chosen.selector, text: chosen.text, strategy: 'table' }; return; }
    if (!listed.length) { var groups = findGroups([], false).filter(function (g) { return g.descHit; }); out.candidates = groups.slice(0, MAX_CANDIDATES); if (groups.length) out.match = { selector: groups[0].selector, text: groups[0].text, strategy: 'rows' }; }
  };

  try {
    if (kind === 'read') findByText();
    else if (kind === 'table') findTable();
    else findRows();
  } catch (e) {
    return { success: false, error: e.message };
  }
  return out;
}

class ReaderScripts {
  static MARKER = '/* site-apis reader probe */';
  static KINDS = Object.freeze(['read', 'extract', 'table']);

  static probe(kind, description, childSelectors = null) {
    const args = [JSON.stringify(String(kind)), JSON.stringify(String(description || '')), JSON.stringify(childSelectors || null)];
    return `${ReaderScripts.MARKER}(${readerProbe.toString()})(${args.join(', ')})`;
  }
}

module.exports = ReaderScripts;
