import BookmarkFolderMenu from './BookmarkFolderMenu.js';

export default class BookmarksBar {
  static EMPTY_TEXT = 'No bookmarks yet. Click the star in the address bar to add this page.';

  static OVERFLOW_GLYPH = String.fromCharCode(0xbb);

  static CARET_GLYPH = String.fromCharCode(0x25be);

  static RESIZE_DEBOUNCE_MS = 80;

  constructor({ tree, favicons, folderMenu, contextMenu, dragDrop, tabActions, bounds }) {
    this._tree = tree;
    this._favicons = favicons;
    this._folderMenu = folderMenu;
    this._contextMenu = contextMenu;
    this._dragDrop = dragDrop;
    this._tabActions = tabActions;
    this._bounds = bounds;
    this.overflowNodes = [];
  }

  install() {
    const host = document.getElementById('bookmarksBarItems');
    if (!host || typeof ResizeObserver !== 'function') return;
    let timer = null;
    new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => { if (this._tree.nodes.length) this.render(); }, BookmarksBar.RESIZE_DEBOUNCE_MS);
    }).observe(host);
  }

  render() {
    const host = document.getElementById('bookmarksBarItems');
    if (!host) return;
    host.innerHTML = '';
    if (!this._tree.nodes.length) {
      host.appendChild(BookmarksBar._emptyNote());
      return;
    }
    for (const node of this._tree.nodes) host.appendChild(this._nodeElement(node));
    this.collapseOverflow();
    this._favicons.prefetch(this._tree.urls()).then((changed) => { if (changed) this.render(); });
  }

  collapseOverflow() {
    const host = document.getElementById('bookmarksBarItems');
    if (!host) return;
    this.overflowNodes = [];
    host.querySelector('.bookmarks-overflow-btn')?.remove();
    const items = [...host.querySelectorAll(':scope > .bookmark-item')];
    if (!items.length) return;
    for (const el of items) el.hidden = false;
    if (host.scrollWidth <= host.clientWidth + 1) return;
    const more = this._overflowButton();
    host.appendChild(more);
    for (let i = items.length - 1; i >= 0 && host.scrollWidth > host.clientWidth + 1; i--) {
      items[i].hidden = true;
      this.overflowNodes.unshift(this._tree.nodes[i]);
    }
  }

  applyVisibility(show) {
    const bar = document.getElementById('bookmarksBar');
    if (bar) bar.classList.toggle('bd-hidden', !show);
    this._bounds.queue();
  }

  _overflowButton() {
    const more = document.createElement('button');
    more.className = 'bookmark-item bookmarks-overflow-btn';
    more.title = 'More bookmarks';
    more.setAttribute('aria-label', 'More bookmarks');
    more.textContent = BookmarksBar.OVERFLOW_GLYPH;
    more.addEventListener('click', (e) => {
      e.stopPropagation();
      this._folderMenu.open({ title: 'More bookmarks', children: this.overflowNodes }, more);
    });
    return more;
  }

  _nodeElement(node) {
    const el = document.createElement('button');
    el.className = 'bookmark-item';
    el.dataset.id = node.id;
    el.dataset.type = node.type;
    el.draggable = true;
    if (node.type === 'folder') this._fillFolder(el, node);
    else this._fillBookmark(el, node);
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this._contextMenu.open(node, e.clientX, e.clientY);
    });
    this._dragDrop.wire(el, node);
    return el;
  }

  _fillFolder(el, node) {
    el.classList.add('bd-folder');
    const caret = document.createElement('span');
    caret.className = 'bd-caret';
    caret.textContent = BookmarksBar.CARET_GLYPH;
    const icon = document.createElement('span');
    icon.className = 'bookmark-favicon bd-fallback';
    icon.innerHTML = BookmarkFolderMenu.FOLDER_SVG;
    el.append(icon, BookmarksBar._label(node.title || 'Folder'), caret);
    el.addEventListener('click', (e) => { e.stopPropagation(); this._folderMenu.open(node, el); });
  }

  _fillBookmark(el, node) {
    el.title = node.url || '';
    el.append(this._favicons.element(node.url, node.title));
    el.appendChild(BookmarksBar._label(node.title || node.url || ''));
    el.addEventListener('click', () => { if (node.url) this._tabActions.navigate(node.url); });
  }

  static _label(text) {
    const label = document.createElement('span');
    label.className = 'bookmark-label';
    label.textContent = text;
    return label;
  }

  static _emptyNote() {
    const empty = document.createElement('span');
    empty.className = 'bookmarks-bar-empty';
    empty.textContent = BookmarksBar.EMPTY_TEXT;
    return empty;
  }
}
