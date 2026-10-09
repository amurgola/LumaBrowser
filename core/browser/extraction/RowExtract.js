class RowExtract {
  static TEXT_OF_SRC = `
function textOf(el) {
  var t = (el.innerText || '').trim();
  if (/(\\.\\.\\.|…)$/.test(t) && el.getAttribute) {
    var full = (el.getAttribute('title') || '').trim();
    if (full.length > t.length) return full;
  }
  return t;
}`;

  static EXTRACT_ROW_SRC = `${RowExtract.TEXT_OF_SRC}
function extractRow(row, childMap) {
  var item = {};
  var els = {};
  for (var key in childMap) {
    var el = row.querySelector(childMap[key]);
    item[key] = el ? textOf(el) : null;
    els[key] = el;
  }
  return { item: item, els: els };
}`;
}

module.exports = RowExtract;
