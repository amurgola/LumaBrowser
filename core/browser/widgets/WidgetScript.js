class WidgetScript {
  static MARKS = ['data-luma-widget-target', 'data-luma-widget-input', 'data-luma-opt', 'data-luma-prepopup', 'data-luma-loadmore'];

  static COMMON_SRC = `
function __norm(s) { return String(s == null ? '' : s).replace(/\\s+/g, ' ').trim(); }
function __find(refNum, selector) {
  if (refNum != null) {
    var r = document.querySelector('[data-luma-ref="' + refNum + '"]');
    if (!r) return { error: 'ref ' + refNum + ' is not on this page (it may have changed since you observed it); call observe_page again and use a fresh ref' };
    return { el: r };
  }
  if (!selector) return { error: 'ref or selector is required' };
  var found = null;
  try { found = document.querySelector(selector); } catch (e) { return { error: 'Invalid CSS selector: ' + selector }; }
  if (!found) return { error: 'No element found for selector ' + selector };
  return { el: found };
}
function __visible(el) {
  if (!el || !el.getBoundingClientRect) return false;
  var r = el.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return false;
  var cs = getComputedStyle(el);
  return cs.visibility !== 'hidden' && cs.display !== 'none';
}
function __name(el) {
  var aria = el.getAttribute && el.getAttribute('aria-label');
  if (aria && aria.trim()) return __norm(aria);
  var by = el.getAttribute && el.getAttribute('aria-labelledby');
  if (by) {
    var t = by.split(/\\s+/).map(function(id) { var n = document.getElementById(id); return n ? n.innerText || n.textContent : ''; }).join(' ');
    if (__norm(t)) return __norm(t);
  }
  var text = __norm(el.innerText || el.textContent);
  if (text) return text;
  return __norm(el.value || el.getAttribute('title') || '');
}
function __point(el, block) {
  try { el.scrollIntoView({ block: block || 'center', inline: 'nearest' }); } catch (_) {}
  var r = el.getBoundingClientRect();
  var x = Math.round(r.left + r.width / 2);
  var y = Math.round(r.top + r.height / 2);
  var at = document.elementFromPoint(x, y);
  var occluded = !at || !(at === el || el.contains(at) || at.contains(el));
  if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) occluded = true;
  return { x: x, y: y, occluded: occluded };
}
function __setNative(el, value) {
  var proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype
    : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  var d = Object.getOwnPropertyDescriptor(proto, 'value');
  if (d && d.set) d.set.call(el, value); else el.value = value;
}
function __clearMarks() {
  ${JSON.stringify(WidgetScript.MARKS)}.forEach(function(a) {
    document.querySelectorAll('[' + a + ']').forEach(function(n) { n.removeAttribute(a); });
  });
}
`;

  static wrap(name, body) {
    return `/* luma-widget:${name} */ (function() {
  try {
    ${WidgetScript.COMMON_SRC}
    ${body}
  } catch (error) { return { success: false, error: error.message }; }
})();`;
  }

  static refArg(ref) {
    return ref != null && Number.isFinite(Number(ref)) ? Math.trunc(Number(ref)) : null;
  }
}

module.exports = WidgetScript;
