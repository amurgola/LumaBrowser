class RowExtract {
  static TEXT_OF_SRC = `
function textOf(el) {
  var t = (el.innerText || '').trim();
  if (/(\\.\\.\\.|…)$/.test(t) && el.getAttribute) {
    var full = (el.getAttribute('title') || '').trim();
    if (full.length > t.length) return full;
  }
  if (el.tagName === 'SELECT') {
    var chosen = el.selectedOptions && el.selectedOptions[0];
    return chosen ? (chosen.textContent || '').trim() : '';
  }
  if (!t && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && typeof el.value === 'string') return el.value.trim();
  return t;
}`;

  static FIELD_SPEC_SRC = `
function fieldSpec(spec) {
  var parts = /^(.*)@([A-Za-z_][A-Za-z0-9_:.-]*)$/.exec(String(spec));
  return parts ? { selector: parts[1].trim(), attr: parts[2] } : { selector: String(spec), attr: null };
}
function attrOf(el, attr) {
  var live = (attr === 'href' || attr === 'src' || attr === 'value') ? el[attr] : null;
  if (typeof live === 'string' && live) return live;
  return el.getAttribute ? el.getAttribute(attr) : null;
}`;

  static EXTRACT_ROW_SRC = `${RowExtract.TEXT_OF_SRC}${RowExtract.FIELD_SPEC_SRC}
function extractRow(row, childMap) {
  var item = {};
  var els = {};
  var attrs = {};
  for (var key in childMap) {
    var spec = fieldSpec(childMap[key]);
    var el = spec.selector ? row.querySelector(spec.selector) : row;
    item[key] = !el ? null : (spec.attr ? attrOf(el, spec.attr) : textOf(el));
    els[key] = el;
    attrs[key] = spec.attr;
  }
  return { item: item, els: els, attrs: attrs };
}`;
}

module.exports = RowExtract;
