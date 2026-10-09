class TableReader {
  static DEFAULT_SELECTOR = 'table';

  static async read(page, options = {}) {
    return page.runEnvelope(TableReader.script(options));
  }

  static script({ selector = TableReader.DEFAULT_SELECTOR, rowSelector, cellSelector } = {}) {
    return `
(function() {
  try {
    const container = document.querySelector(${JSON.stringify(selector)});
    if (!container) return { success: false, error: 'No element found' };
    if (container.tagName === 'TABLE') {
      const headers = [];
      const thRow = container.querySelector('thead tr') || container.querySelector('tr');
      if (thRow) thRow.querySelectorAll('th, td').forEach(c => headers.push(c.textContent.trim()));
      const rows = [];
      const bodyRows = container.querySelectorAll('tbody tr');
      const allRows = bodyRows.length > 0 ? bodyRows : container.querySelectorAll('tr');
      allRows.forEach((tr, i) => {
        if (i === 0 && !container.querySelector('thead') && headers.length > 0) return;
        const cells = [];
        tr.querySelectorAll('td, th').forEach(c => cells.push(c.textContent.trim()));
        if (cells.length > 0) rows.push(cells);
      });
      return { success: true, headers, rows, rowCount: rows.length };
    }
    const rSel = ${JSON.stringify(rowSelector || null)};
    const cSel = ${JSON.stringify(cellSelector || null)};
    if (rSel && cSel) {
      const rowEls = container.querySelectorAll(rSel);
      const rows = [];
      rowEls.forEach(row => {
        const cells = [];
        row.querySelectorAll(cSel).forEach(c => cells.push(c.textContent.trim()));
        if (cells.length > 0) rows.push(cells);
      });
      return { success: true, headers: rows.length > 0 ? rows[0] : [], rows: rows.slice(1), rowCount: Math.max(0, rows.length - 1) };
    }
    const children = container.children;
    const rows = [];
    for (const child of children) {
      const cells = [];
      for (const cell of child.children) cells.push(cell.textContent.trim());
      if (cells.length > 0) rows.push(cells);
    }
    return { success: true, headers: rows.length > 0 ? rows[0] : [], rows: rows.slice(1), rowCount: Math.max(0, rows.length - 1) };
  } catch(e) { return { success: false, error: e.message }; }
})();`.trim();
  }
}

module.exports = TableReader;
