import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import BookmarkFolderMenu from './BookmarkFolderMenu.js';

export default class BookmarkManager {
  constructor({ tree, favicons, nodeActions, tabActions, bounds }) {
    this._tree = tree;
    this._favicons = favicons;
    this._actions = nodeActions;
    this._tabActions = tabActions;
    this._bounds = bounds;
  }

  install() {
    document.getElementById('bookmarkManagerCloseBtn')?.addEventListener('click', () => this.close());
    document.getElementById('bmAddFolderBtn')?.addEventListener('click', () => this._actions.addFolder());
    document.getElementById('bookmarkManagerModal')?.addEventListener('mousedown', (e) => {
      if (e.target.id === 'bookmarkManagerModal') this.close();
    });
  }

  isOpen() {
    const modal = document.getElementById('bookmarkManagerModal');
    return !!modal && !modal.hidden;
  }

  open() {
    const modal = document.getElementById('bookmarkManagerModal');
    if (!modal) return;
    modal.hidden = false;
    this.render();
    this._bounds.queue();
  }

  close() {
    const modal = document.getElementById('bookmarkManagerModal');
    if (modal) modal.hidden = true;
    this._bounds.queue();
  }

  render() {
    const list = document.getElementById('bookmarkManagerList');
    if (!list) return;
    list.innerHTML = '';
    if (!this._tree.nodes.length) {
      list.appendChild(BookmarkManager._div('bd-empty', 'No bookmarks yet.'));
      return;
    }
    for (const node of this._tree.nodes) {
      list.appendChild(node.type === 'folder' ? this._folder(node) : this._row(node));
    }
  }

  folderOptions(selectedParentId) {
    const opts = ['<option value="">Bookmarks bar</option>'];
    for (const f of this._tree.folders()) {
      const sel = f.id === selectedParentId ? ' selected' : '';
      opts.push(`<option value="${HtmlEscaper.escape(f.id)}"${sel}>${HtmlEscaper.escape(f.title || 'Folder')}</option>`);
    }
    return opts.join('');
  }

  _folder(node) {
    const wrap = BookmarkManager._div('bd-tree-folder');
    const head = BookmarkManager._div('bd-tree-folder-head');
    const icon = document.createElement('span');
    icon.innerHTML = BookmarkFolderMenu.FOLDER_SVG;
    const name = BookmarkManager._span('bd-row-title', node.title || 'Folder');
    name.style.flex = '1';
    const buttons = BookmarkManager._div('bd-tree-actions');
    buttons.append(...this._renameDelete(node));
    head.append(icon, name, buttons);
    wrap.appendChild(head);
    const children = BookmarkManager._div('bd-tree-children');
    const kids = node.children || [];
    if (!kids.length) children.appendChild(BookmarkManager._div('bd-folder-menu-empty', '(empty)'));
    else for (const kid of kids) children.appendChild(this._row(kid));
    wrap.appendChild(children);
    return wrap;
  }

  _row(node) {
    const el = BookmarkManager._div('bd-tree-row');
    el.append(this._favicons.element(node.url, node.title));
    const main = BookmarkManager._div('bd-row-main');
    main.append(BookmarkManager._span('bd-row-title', node.title || node.url), BookmarkManager._span('bd-row-url', node.url || ''));
    main.addEventListener('click', () => { if (node.url) { this._tabActions.navigate(node.url); this.close(); } });
    const actions = BookmarkManager._div('bd-tree-actions');
    actions.append(this._movePicker(node), BookmarkManager._startupToggle(node), ...this._renameDelete(node));
    el.append(main, actions);
    return el;
  }

  _renameDelete(node) {
    return [
      BookmarkManager._button('Rename', () => this._actions.rename(node)),
      BookmarkManager._button('Delete', () => this._actions.remove(node)),
    ];
  }

  _movePicker(node) {
    const move = document.createElement('select');
    move.innerHTML = this.folderOptions(node.parentId);
    move.title = 'Move to folder';
    move.addEventListener('change', async () => {
      await window.bookmarksAPI.move(node.id, move.value || null);
      this._tree.reload();
    });
    return move;
  }

  static _startupToggle(node) {
    const startup = document.createElement('label');
    startup.className = 'bd-startup-toggle';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !!node.openOnStartup;
    cb.addEventListener('change', async () => { await window.bookmarksAPI.update(node.id, { openOnStartup: cb.checked }); });
    startup.append(cb, document.createTextNode('Startup'));
    return startup;
  }

  static _button(text, onClick) {
    const btn = document.createElement('button');
    btn.className = 'bd-icon-btn';
    btn.textContent = text;
    btn.addEventListener('click', onClick);
    return btn;
  }

  static _div(cls, text) {
    const el = document.createElement('div');
    el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  }

  static _span(cls, text) {
    const el = document.createElement('span');
    el.className = cls;
    el.textContent = text;
    return el;
  }
}
