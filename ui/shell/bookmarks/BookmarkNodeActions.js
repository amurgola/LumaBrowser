import Dialogs from '../../../core/llm-server/ui/js/dialogs/Dialogs.js';

export default class BookmarkNodeActions {
  constructor({ tree }) {
    this._tree = tree;
  }

  async rename(node) {
    const name = await Dialogs.prompt('New name', node.title || '', { title: 'Rename', okLabel: 'Rename' });
    if (name == null) return;
    await window.bookmarksAPI.update(node.id, { title: String(name).trim() || node.title });
    this._tree.reload();
  }

  async editUrl(node) {
    const url = await Dialogs.prompt('Address', node.url || '', { title: 'Edit URL', okLabel: 'Save' });
    if (url == null) return;
    await window.bookmarksAPI.update(node.id, { url: String(url).trim() });
    this._tree.reload();
  }

  async toggleStartup(node) {
    await window.bookmarksAPI.update(node.id, { openOnStartup: !node.openOnStartup });
    this._tree.reload();
  }

  async remove(node) {
    const folder = node.type === 'folder';
    const msg = folder
      ? `Delete folder "${node.title || ''}" and everything in it?`
      : `Delete bookmark "${node.title || node.url || ''}"?`;
    const ok = await Dialogs.confirm(msg, { title: folder ? 'Delete folder' : 'Delete bookmark', okLabel: 'Delete', danger: true });
    if (!ok) return;
    await window.bookmarksAPI.remove(node.id);
    this._tree.reload();
  }

  async addFolder() {
    const name = await Dialogs.prompt('Folder name', 'New folder', { title: 'New folder', okLabel: 'Create' });
    if (name == null) return;
    await window.bookmarksAPI.addFolder({ title: String(name).trim() || 'New folder' });
    this._tree.reload();
  }
}
