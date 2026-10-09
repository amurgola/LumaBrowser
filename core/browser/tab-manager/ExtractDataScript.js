const RowExtract = require('../extraction/RowExtract');

class ExtractDataScript {
  static build({ baseSelector, childSelectors, preferTableStructure }) {
    return `
(function() {
  try {
    const rows = document.querySelectorAll(${JSON.stringify(baseSelector)});
    if (rows.length === 0) return { success: false, error: 'No elements found' };
    // Table-kind repeaters: learned childSelectors routinely misalign on
    // real tables (class + :nth-of-type counts tag position, not class
    // position), while the table's own structure is authoritative. When the
    // caller says the item is a table and the rows really are <tr>s, key
    // cells by their column headers instead.
    // textOf + extractRow: shared with collect_list (extraction/RowExtract.js).
    ${RowExtract.EXTRACT_ROW_SRC}
    if (${JSON.stringify(!!preferTableStructure)} && rows[0].tagName === 'TR') {
      var table = rows[0].closest('table');
      var headers = [];
      var headerRow = table ? (table.querySelector('thead tr') || table.querySelector('tr')) : null;
      if (headerRow) headerRow.querySelectorAll('th, td').forEach(function(c) { headers.push(c.innerText.trim()); });
      var tableOut = [];
      rows.forEach(function(row) {
        if (row === headerRow) return;
        var item = {};
        var cells = row.querySelectorAll('td, th');
        for (var i = 0; i < cells.length; i++) {
          item[headers[i] || ('col' + (i + 1))] = textOf(cells[i]);
        }
        if (Object.keys(item).length > 0) tableOut.push(item);
      });
      return { success: true, data: tableOut, rowCount: tableOut.length, extractionMode: 'table-structure' };
    }
    const childMap = ${JSON.stringify(childSelectors)};
    const results = [];
    // Track fields that resolve to the SAME element within a row: a child-
    // selector defect (e.g. link/home/buy_new all hitting one anchor). Groups
    // are only reported when duplicated in every row, i.e. structural.
    const groupCounts = {};
    const nullCounts = {};
    rows.forEach(function(row) {
      var extracted = extractRow(row, childMap);
      var item = extracted.item;
      var byElement = [];
      for (var key in childMap) {
        var el = extracted.els[key];
        if (!el) nullCounts[key] = (nullCounts[key] || 0) + 1;
        if (el) {
          var hit = null;
          for (var i = 0; i < byElement.length; i++) {
            if (byElement[i].el === el) { hit = byElement[i]; break; }
          }
          if (hit) hit.keys.push(key); else byElement.push({ el: el, keys: [key] });
        }
      }
      byElement.forEach(function(g) {
        if (g.keys.length > 1) {
          var id = g.keys.slice().sort().join('|');
          groupCounts[id] = (groupCounts[id] || 0) + 1;
        }
      });
      results.push(item);
    });
    var duplicateFieldGroups = [];
    for (var id in groupCounts) {
      if (groupCounts[id] === results.length) duplicateFieldGroups.push(id.split('|'));
    }
    var nullFields = [];
    for (var nk in childMap) {
      if ((nullCounts[nk] || 0) === results.length) nullFields.push(nk);
    }
    // A field returning the identical non-empty value in every row (while
    // other fields vary) usually means the selector hit a static label
    // instead of the row's data (the isbn10 "Edition:" defect).
    var constantFields = [];
    if (results.length >= 3) {
      var totalFields = 0;
      for (var ck in childMap) {
        totalFields++;
        var first = results[0][ck];
        if (first === null || first === '') continue;
        var allSame = true;
        for (var ri = 1; ri < results.length; ri++) {
          if (results[ri][ck] !== first) { allSame = false; break; }
        }
        if (allSame) constantFields.push({ field: ck, value: first.length > 60 ? first.slice(0, 60) + '…' : first });
      }
      // Every field constant means the rows themselves are identical; that is
      // a page trait, not a selector defect.
      if (constantFields.length === totalFields) constantFields = [];
    }
    return { success: true, data: results, rowCount: results.length, duplicateFieldGroups: duplicateFieldGroups, nullFields: nullFields, constantFields: constantFields };
  } catch(e) { return { success: false, error: e.message }; }
})();`.trim();
  }
}

module.exports = ExtractDataScript;
