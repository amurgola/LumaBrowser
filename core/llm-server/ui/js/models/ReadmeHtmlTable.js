export default class ReadmeHtmlTable {
  static MAX_COLSPAN = 32;

  static render(body, inline) {
    const rows = ReadmeHtmlTable._rows(body);
    if (!rows.length) return '';
    const cell = (c) => ReadmeHtmlTable._cell(c, inline);
    const head = rows[0].every((c) => c.th) ? rows.shift() : null;
    const thead = head ? `<thead><tr>${head.map(cell).join('')}</tr></thead>` : '';
    const tbody = `<tbody>${rows.map((r) => `<tr>${r.map(cell).join('')}</tr>`).join('')}</tbody>`;
    return `<table class="ms-table">${thead}${tbody}</table>`;
  }

  static _rows(body) {
    const rows = [];
    body.replace(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi, (_m, rowHtml) => {
      const cells = ReadmeHtmlTable._cells(rowHtml);
      if (cells.length) rows.push(cells);
      return '';
    });
    return rows;
  }

  static _cells(rowHtml) {
    const cells = [];
    rowHtml.replace(/<(th|td)\b([^>]*)>([\s\S]*?)<\/\1>/gi, (_m, tag, attrs, html) => {
      const colspan = /\bcolspan\s*=\s*["']?(\d+)/i.exec(attrs);
      cells.push({ th: /^th$/i.test(tag), span: colspan ? Math.min(ReadmeHtmlTable.MAX_COLSPAN, +colspan[1]) : 1, html });
      return '';
    });
    return cells;
  }

  static _cell(c, inline) {
    const tag = c.th ? 'th' : 'td';
    const span = c.span > 1 ? ` colspan="${c.span}"` : '';
    return `<${tag}${span}>${inline.render(c.html.replace(/<br\s*\/?>/gi, ' '))}</${tag}>`;
  }
}
