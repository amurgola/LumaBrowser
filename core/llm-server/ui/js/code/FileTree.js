import HtmlEscaper from '../format/HtmlEscaper.js';
import CodeIcons from './CodeIcons.js';
import WorkspacePath from './WorkspacePath.js';

const esc = HtmlEscaper.escape;

export default class FileTree {
  static INDENT_PX = 14;
  static BASE_PAD_PX = 6;

  constructor({ element, client, status, onRoot }) {
    this.element = element;
    this._client = client;
    this._status = status;
    this._onRoot = onRoot;
    this._expanded = new Set();
    this._listing = new Map();
  }

  async listDir(dir) {
    const r = await this._client.call('list', { dir });
    if (!r || !r.success) { this._status.show((r && r.error) || 'Could not read the folder.', 'error'); return []; }
    if (r.root) this._onRoot(r.root);
    this._listing.set(dir, r.entries || []);
    return r.entries || [];
  }

  render(activePath) {
    const rows = [];
    this._walk('', 0, activePath, rows);
    this.element.innerHTML = rows.join('') || '<div class="ce-empty">This folder is empty. Use “New file” to start.</div>';
  }

  showMessage(html) {
    this.element.innerHTML = html;
  }

  async toggle(dir, activePath) {
    if (this._expanded.has(dir)) {
      this._expanded.delete(dir);
    } else {
      this._expanded.add(dir);
      if (!this._listing.has(dir)) await this.listDir(dir);
    }
    this.render(activePath);
  }

  async reveal(dir) {
    let acc = '';
    for (const segment of dir.split('/').filter(Boolean)) {
      acc = acc ? acc + '/' + segment : segment;
      this._expanded.add(acc);
      if (!this._listing.has(acc)) await this.listDir(acc);
    }
  }

  async refreshListed() {
    for (const dir of ['', ...Array.from(this._expanded)]) await this.listDir(dir);
    for (const dir of Array.from(this._listing.keys())) {
      if (dir && !this._expanded.has(dir)) this._listing.delete(dir);
    }
  }

  forget(path) {
    for (const dir of Array.from(this._listing.keys())) {
      if (WorkspacePath.isWithin(dir, path)) { this._listing.delete(dir); this._expanded.delete(dir); }
    }
  }

  clear() {
    this._expanded.clear();
    this._listing.clear();
  }

  _walk(dir, depth, activePath, rows) {
    for (const entry of (this._listing.get(dir) || [])) {
      const open = entry.type === 'dir' && this._expanded.has(entry.path);
      rows.push(FileTree._row(entry, depth, open, entry.path === activePath));
      if (open) this._walk(entry.path, depth + 1, activePath, rows);
    }
  }

  static _row(entry, depth, open, active) {
    const isDir = entry.type === 'dir';
    return `<div class="ce-row${active ? ' ce-row--active' : ''}" data-path="${esc(entry.path)}" data-type="${entry.type}" style="padding-left:${FileTree.BASE_PAD_PX + depth * FileTree.INDENT_PX}px">`
      + `<span class="ce-tw${isDir ? '' : ' ce-tw--leaf'}${open ? ' ce-tw--open' : ''}">${isDir ? CodeIcons.CHEVRON : CodeIcons.FILE}</span>`
      + `<span class="ce-name">${esc(entry.name)}</span>`
      + '</div>';
  }
}
