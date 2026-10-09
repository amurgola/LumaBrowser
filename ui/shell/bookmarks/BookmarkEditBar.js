export default class BookmarkEditBar {
  constructor({ tree, bounds, closeFindBar, refreshStar }) {
    this._tree = tree;
    this._bounds = bounds;
    this._closeFindBar = closeFindBar;
    this._refreshStar = refreshStar;
  }

  install() {
    const bar = document.getElementById('bookmarkEditBar');
    if (!bar) return;
    document.getElementById('bmEditDone')?.addEventListener('click', () => this.save());
    document.getElementById('bmEditRemove')?.addEventListener('click', () => this.remove());
    document.getElementById('bmEditClose')?.addEventListener('click', () => this.close());
    bar.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target && e.target.id === 'bmEditName') { e.preventDefault(); this.save(); }
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.close(); }
    });
  }

  isOpen() {
    const bar = document.getElementById('bookmarkEditBar');
    return !!bar && !bar.hidden;
  }

  open(node, tab, added) {
    const bar = document.getElementById('bookmarkEditBar');
    if (!bar) return;
    this._closeFindBar();
    const name = document.getElementById('bmEditName');
    const status = document.getElementById('bmEditStatus');
    bar.dataset.nodeId = node ? node.id : '';
    bar.dataset.url = tab.url;
    if (status) status.textContent = added ? 'Bookmark added' : 'Edit bookmark';
    if (name) name.value = (node && node.title) || tab.title || tab.url;
    this._fillFolders(document.getElementById('bmEditFolder'), node);
    bar.hidden = false;
    this._bounds.queue();
    if (name) { name.focus(); name.select(); }
  }

  close() {
    const bar = document.getElementById('bookmarkEditBar');
    if (!bar || bar.hidden) return;
    bar.hidden = true;
    this._bounds.queue();
  }

  async save() {
    const bar = document.getElementById('bookmarkEditBar');
    if (!bar || !window.bookmarksAPI) return;
    const id = bar.dataset.nodeId;
    const name = (document.getElementById('bmEditName')?.value || '').trim();
    const folder = document.getElementById('bmEditFolder')?.value || '';
    const node = id ? this._tree.findById(id) : null;
    try {
      if (node) await BookmarkEditBar._applyEdits(node, name, folder);
    } catch (e) { console.warn('save bookmark failed:', e.message); }
    this.close();
    this._tree.reload();
  }

  async remove() {
    const bar = document.getElementById('bookmarkEditBar');
    if (!bar || !window.bookmarksAPI) return;
    const id = bar.dataset.nodeId;
    const url = bar.dataset.url;
    try {
      if (id) await window.bookmarksAPI.remove(id);
      else if (url) await window.bookmarksAPI.toggleUrl(url, '');
    } catch (e) { console.warn('remove bookmark failed:', e.message); }
    this.close();
    await this._tree.reload();
    this._refreshStar(url);
  }

  static async _applyEdits(node, name, folder) {
    if (name && name !== node.title) await window.bookmarksAPI.update(node.id, { title: name });
    if (folder !== (node.parentId || '')) await window.bookmarksAPI.move(node.id, folder || null);
  }

  _fillFolders(select, node) {
    if (!select) return;
    select.innerHTML = '<option value="">Bookmarks bar</option>';
    for (const f of this._tree.folders()) {
      const opt = document.createElement('option');
      opt.value = f.id;
      opt.textContent = f.title || 'Folder';
      select.appendChild(opt);
    }
    const parentId = node && node.parentId ? node.parentId : '';
    select.value = parentId;
    if (select.value !== parentId) select.value = '';
  }
}
