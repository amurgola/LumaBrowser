import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';

export default class BookmarkFolderMenu {
  static WIDTH = 260;

  static FOLDER_SVG = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" fill="currentColor"/></svg>';

  static FOLDER_ICON = `<span class="bookmark-favicon bd-fallback">${this.FOLDER_SVG}</span>`;

  constructor({ popupMenu, favicons, tabActions }) {
    this._menu = popupMenu;
    this._favicons = favicons;
    this._tabActions = tabActions;
  }

  open(folder, anchorEl) {
    const children = folder.children || [];
    const r = anchorEl.getBoundingClientRect();
    this._menu.openFolder(children, `<div class="bd-folder-menu">${this.html(children)}</div>`, {
      x: r.left,
      y: r.bottom + 4,
      width: BookmarkFolderMenu.WIDTH,
      estHeight: Math.max(40, (children.length || 1) * 34 + 12),
    });
  }

  html(children) {
    if (!children.length) return '<div class="bd-folder-menu-empty">Empty folder</div>';
    const esc = HtmlEscaper.escape;
    return children.map((child, i) => {
      if (child.type === 'folder') {
        return `<button class="bookmark-item" data-bd-action="open" data-bd-index="${i}" title="${esc(child.title || 'Folder')}">`
          + BookmarkFolderMenu.FOLDER_ICON
          + `<span class="bookmark-label">${esc(child.title || 'Folder')}</span></button>`;
      }
      return `<button class="bookmark-item" data-bd-action="open" data-bd-index="${i}" title="${esc(child.url || '')}">`
        + `${this._favicons.html(child.url, child.title)}`
        + `<span class="bookmark-label">${esc(child.title || child.url || '')}</span></button>`;
    }).join('');
  }

  pick(index, host) {
    const child = this._menu.folderChild(index);
    host.hide();
    if (child && child.type === 'folder') {
      const anchor = document.querySelector('.bookmarks-overflow-btn') || document.getElementById('bookmarksBarItems');
      if (anchor) this.open(child, anchor);
    } else if (child && child.url) {
      this._tabActions.navigate(child.url);
    }
  }
}
