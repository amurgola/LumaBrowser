import HtmlEscaper from '../../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import HubSection from './HubSection.js';

export default class BoardColumnsSection extends HubSection {
  constructor(tab, { onSaved = () => {} } = {}) {
    super(tab);
    this._onSaved = onSaved;
    this._columns = [];
  }

  html() {
    return `
    <h4 class="luma-section-label">Board columns</h4>
    <div class="luma-field-help">The lanes of the task board. The key is what agents and trackers refer to; mark the column finished tasks land in as done.</div>
    <div class="ext-mt-8" id="ext-hub-colList"></div>
    <div class="luma-form-actions ext-form-buttons--start ext-mt-8">
      <button class="luma-btn luma-btn--sm" id="ext-hub-colAddBtn">Add column</button>
      <button class="luma-btn" id="ext-hub-colSaveBtn">Save columns</button>
    </div>`;
  }

  bind(container) {
    super.bind(container);
    this.$('colAddBtn').addEventListener('click', () => this._addRow());
    this.$('colSaveBtn').addEventListener('click', () => this._save());
    this.$('colList').addEventListener('click', (e) => this._onRowAction(e));
    this.$('colList').addEventListener('input', (e) => this._onTitleInput(e));
  }

  columns() {
    return this._columns;
  }

  async load() {
    if (!this._root) return;
    const { columns } = await this.call('listColumns');
    this._columns = (columns || []).map((c) => ({ ...c }));
    this._render();
  }

  static slug(title) {
    return String(title || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  _render() {
    const esc = HtmlEscaper.escape;
    this.$('colList').innerHTML = this._columns.map((c, i) => `
      <div class="ext-form-row-inline ext-mb-8" data-index="${i}">
        <input type="text" class="luma-field-input" data-field="title" value="${esc(c.title)}" placeholder="Title" aria-label="Column title">
        <input type="text" class="luma-field-input" data-field="key" value="${esc(c.key)}" placeholder="key" aria-label="Column key" style="max-width:140px">
        <label class="luma-check"><input type="checkbox" data-field="isDone"${c.isDone ? ' checked' : ''}> Done</label>
        <button class="luma-btn luma-btn--sm" data-action="up" title="Move up"${i === 0 ? ' disabled' : ''}>Up</button>
        <button class="luma-btn luma-btn--sm" data-action="down" title="Move down"${i === this._columns.length - 1 ? ' disabled' : ''}>Down</button>
        <button class="luma-btn luma-btn--sm" data-action="remove" title="Remove column">Remove</button>
      </div>`).join('') || '<div class="luma-empty luma-empty--plain">No columns. Add one.</div>';
  }

  _readRows() {
    return this.$$('#ext-hub-colList [data-index]').map((row) => ({
      id: this._columns[Number(row.dataset.index)] ? this._columns[Number(row.dataset.index)].id : undefined,
      title: row.querySelector('[data-field="title"]').value.trim(),
      key: row.querySelector('[data-field="key"]').value.trim(),
      isDone: row.querySelector('[data-field="isDone"]').checked,
    }));
  }

  _onTitleInput(e) {
    const row = e.target.closest('[data-index]');
    if (!row) return;
    const keyInput = row.querySelector('[data-field="key"]');
    if (e.target === keyInput) {
      keyInput.dataset.touched = '1';
      return;
    }
    if (e.target.matches('[data-field="title"]') && !keyInput.dataset.touched) keyInput.value = BoardColumnsSection.slug(e.target.value);
  }

  _onRowAction(e) {
    const button = e.target.closest('button[data-action]');
    if (!button) return;
    const row = button.closest('[data-index]');
    const index = Number(row.dataset.index);
    this._columns = this._readRows();
    if (button.dataset.action === 'remove') this._columns.splice(index, 1);
    if (button.dataset.action === 'up' && index > 0) BoardColumnsSection._swap(this._columns, index, index - 1);
    if (button.dataset.action === 'down' && index < this._columns.length - 1) BoardColumnsSection._swap(this._columns, index, index + 1);
    this._render();
  }

  _addRow() {
    this._columns = this._readRows();
    this._columns.push({ title: '', key: '', isDone: false });
    this._render();
    const rows = this.$$('#ext-hub-colList [data-index]');
    const last = rows[rows.length - 1];
    if (last) last.querySelector('[data-field="title"]').focus();
  }

  static _swap(list, a, b) {
    [list[a], list[b]] = [list[b], list[a]];
  }

  _payload() {
    const seen = new Set();
    const columns = [];
    for (const c of this._readRows()) {
      const title = c.title || c.key;
      if (!title) continue;
      const key = BoardColumnsSection.slug(c.key || title);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      columns.push({ id: c.id, key, title, sortOrder: columns.length, isDone: !!c.isDone });
    }
    return columns;
  }

  async _save() {
    const columns = this._payload();
    if (!columns.length) return this._tab.notify('Keep at least one column.', false);
    return this.act(async () => {
      const reply = await this.call('saveColumns', columns);
      this._onSaved(reply.columns || columns);
    }, 'Columns saved.');
  }
}
