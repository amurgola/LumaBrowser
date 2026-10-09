const WidgetScript = require('./WidgetScript');
const RowExtract = require('../extraction/RowExtract');

class ListScripts {
  static SCROLL_ROOT_SRC = `
function __scrollRoot(first) {
  var n = first ? first.parentElement : null;
  while (n && n !== document.body && n !== document.documentElement) {
    var cs = getComputedStyle(n);
    if (/(auto|scroll|overlay)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 4) return n;
    n = n.parentElement;
  }
  return null;
}
// endVisible: the last rendered item's bottom edge is on screen (or already
// scrolled past). Until then "no new items" only means the scroll has not
// reached the end of what is already loaded, not that the list is done.
function __rootState(root, last) {
  var lastBottom = last ? last.getBoundingClientRect().bottom : -Infinity;
  if (root) {
    var rr = root.getBoundingClientRect();
    return {
      scrollTop: root.scrollTop, container: 'element',
      atBottom: root.scrollTop + root.clientHeight >= root.scrollHeight - 4,
      endVisible: lastBottom <= rr.bottom + 4,
    };
  }
  var se = document.scrollingElement || document.documentElement;
  return {
    scrollTop: se.scrollTop, container: 'window',
    atBottom: window.innerHeight + se.scrollTop >= se.scrollHeight - 4,
    endVisible: lastBottom <= window.innerHeight + 4,
  };
}
function __hash(s) {
  var h = 5381;
  for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
`;

  static collectListStepScript({ itemSelector, childSelectors }) {
    const childMap = ListScripts._childMap(childSelectors);
    return WidgetScript.wrap('collectListStep', `
    ${RowExtract.EXTRACT_ROW_SRC}
    ${ListScripts.SCROLL_ROOT_SRC}
    var nodes;
    try { nodes = document.querySelectorAll(${JSON.stringify(itemSelector)}); }
    catch (e) { return { success: false, error: 'Invalid item selector: ' + ${JSON.stringify(itemSelector)} }; }
    var childMap = ${JSON.stringify(childMap)};
    var KEY_ATTRS = ['data-key', 'data-id', 'data-item-id', 'data-index', 'data-row-index', 'aria-rowindex', 'aria-posinset'];
    var ORDER_ATTRS = ['data-index', 'data-row-index', 'aria-rowindex', 'aria-posinset'];
    var items = [];
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var r = el.getBoundingClientRect();
      if (r.width < 1 && r.height < 1) continue;
      var fields;
      if (childMap) fields = extractRow(el, childMap).item;
      else {
        var text = textOf(el);
        fields = { text: text.length > 500 ? text.slice(0, 500) + '…' : text };
        var a = el.matches('a[href]') ? el : el.querySelector('a[href]');
        if (a && a.href) fields.href = a.href;
      }
      var attrKey = null;
      for (var k = 0; k < KEY_ATTRS.length && !attrKey; k++) attrKey = el.getAttribute(KEY_ATTRS[k]);
      var order = null;
      for (var o = 0; o < ORDER_ATTRS.length && order == null; o++) {
        var ov = el.getAttribute(ORDER_ATTRS[o]);
        if (ov != null && ov !== '' && !isNaN(Number(ov))) order = Number(ov);
      }
      var linkEl = el.matches('a[href]') ? el : el.querySelector('a[href]');
      var key = attrKey ? 'k:' + attrKey : 'h:' + (linkEl ? linkEl.href : '') + '|' + __hash(JSON.stringify(fields));
      items.push({ key: key, order: order, fields: fields });
    }
    var root = __scrollRoot(nodes[0]);
    var st = __rootState(root, nodes[nodes.length - 1]);
    return { success: true, items: items, total: nodes.length, scrollTop: st.scrollTop, atBottom: st.atBottom, endVisible: st.endVisible, container: st.container };
  `);
  }

  static scrollListScript({ itemSelector }) {
    return WidgetScript.wrap('scrollList', `
    ${ListScripts.SCROLL_ROOT_SRC}
    var first = null;
    try { first = document.querySelector(${JSON.stringify(itemSelector)}); } catch (_) {}
    var root = __scrollRoot(first);
    var before = __rootState(root).scrollTop;
    if (root) root.scrollTop = root.scrollTop + Math.max(60, root.clientHeight * 0.85);
    else window.scrollBy(0, Math.max(200, window.innerHeight * 0.85));
    var st = __rootState(root);
    return { success: true, moved: st.scrollTop !== before, atBottom: st.atBottom, container: st.container };
  `);
  }

  static findLoadMoreScript({ itemSelector }) {
    return WidgetScript.wrap('findLoadMore', `
    document.querySelectorAll('[data-luma-loadmore]').forEach(function(n) { n.removeAttribute('data-luma-loadmore'); });
    var first = null;
    try { first = document.querySelector(${JSON.stringify(itemSelector)}); } catch (_) {}
    if (!first || !first.parentElement) return { success: true, found: false };
    var scope = first.parentElement.parentElement || first.parentElement;
    var RE = /^(load|show|see|view|display)\\s+(\\d+\\s+)?more\\b|^more\\s+(results|items|products|posts|stories|comments|reviews)\\b/i;
    var cands = scope.querySelectorAll('button, [role=button], a, input[type=button], input[type=submit]');
    for (var i = 0; i < cands.length; i++) {
      var c = cands[i];
      if (!(first.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
      // A "Show more" INSIDE an item expands that item's text, not the list.
      try { if (c.closest(${JSON.stringify(itemSelector)})) continue; } catch (_) {}
      if (c.disabled || c.getAttribute('aria-disabled') === 'true') continue;
      var label = __norm(c.tagName === 'INPUT' ? c.value : (c.innerText || c.textContent || c.getAttribute('aria-label')));
      if (!RE.test(label) || label.length > 60) continue;
      if (c.tagName === 'A') {
        var href = c.getAttribute('href');
        if (href && href !== '#' && !/^javascript:/i.test(href)) continue;
      }
      var cs = getComputedStyle(c);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      c.setAttribute('data-luma-loadmore', '1');
      var p = __point(c);
      return { success: true, found: true, label: label, x: p.x, y: p.y, occluded: p.occluded };
    }
    return { success: true, found: false };
  `);
  }

  static clickLoadMoreScript() {
    return WidgetScript.wrap('clickLoadMore', `
    var c = document.querySelector('[data-luma-loadmore]');
    if (!c) return { success: false, error: 'load-more control vanished' };
    c.click();
    return { success: true };
  `);
  }

  static _childMap(childSelectors) {
    const usable = childSelectors && typeof childSelectors === 'object' && Object.keys(childSelectors).length;
    return usable ? childSelectors : null;
  }
}

module.exports = ListScripts;
