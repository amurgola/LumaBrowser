const BlockRenderer = require('./BlockRenderer');
const MarkdownTableRenderer = require('./MarkdownTableRenderer');

class TableBlockRenderer extends BlockRenderer {
  static ROW_GROUPS = new Set(['tbody', 'tfoot', 'thead']);
  static CELLS = new Set(['td', 'th']);
  static LAYOUT_ROLES = new Set(['none', 'presentation']);
  static MAX_COLSPAN = 20;

  get elementNames() {
    return ['table'];
  }

  render(node, writer) {
    if (writer.inline) return this.renderer.renderChildren(node, writer);
    const rows = this._rows(node, []);
    if (TableBlockRenderer._isLayout(node, rows)) return this._unwrap(node, writer);
    const caption = this._caption(node);
    const table = MarkdownTableRenderer.render(rows).trim();
    return writer.block([caption, table].filter(Boolean).join('\n\n'));
  }

  _rows(container, rows) {
    for (const child of container.elementChildren()) {
      if (child.name === 'tr') rows.push(this._cells(child));
      else if (TableBlockRenderer.ROW_GROUPS.has(child.name)) this._rows(child, rows);
    }
    return rows;
  }

  _cells(row) {
    const cells = [];
    for (const cell of row.elementChildren().filter((child) => TableBlockRenderer.CELLS.has(child.name))) {
      cells.push(this.renderer.renderInline(cell).trim());
      for (let extra = 1; extra < TableBlockRenderer._colspan(cell); extra++) cells.push('');
    }
    return cells;
  }

  _caption(table) {
    const caption = table.elementChildren().find((child) => child.name === 'caption');
    return caption ? this.renderer.renderInline(caption).trim() : '';
  }

  _unwrap(table, writer) {
    writer.blockBreak();
    this.renderer.renderChildren(table, writer);
    writer.blockBreak();
  }

  static _colspan(cell) {
    const span = parseInt(cell.attribute('colspan'), 10);
    return Number.isFinite(span) ? Math.min(Math.max(span, 1), TableBlockRenderer.MAX_COLSPAN) : 1;
  }

  static _isLayout(table, rows) {
    const role = String(table.attribute('role') || '').toLowerCase();
    const width = Math.max(0, ...rows.map((row) => row.length));
    return TableBlockRenderer.LAYOUT_ROLES.has(role) || width <= 1;
  }
}

module.exports = TableBlockRenderer;
