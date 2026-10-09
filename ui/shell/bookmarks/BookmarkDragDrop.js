export default class BookmarkDragDrop {
  constructor({ tree }) {
    this._tree = tree;
    this._dragId = null;
  }

  wire(el, node) {
    el.addEventListener('dragstart', (e) => this._onDragStart(e, node));
    el.addEventListener('dragend', () => { this._dragId = null; el.classList.remove('bd-drop-target'); });
    el.addEventListener('dragover', (e) => this._onDragOver(e, el, node));
    el.addEventListener('dragleave', () => el.classList.remove('bd-drop-target'));
    el.addEventListener('drop', (e) => this._onDrop(e, el, node));
  }

  _onDragStart(e, node) {
    this._dragId = node.id;
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', node.id); } catch (_) {}
  }

  _onDragOver(e, el, node) {
    if (!this._dragId || this._dragId === node.id) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (node.type === 'folder') el.classList.add('bd-drop-target');
  }

  async _onDrop(e, el, node) {
    e.preventDefault();
    el.classList.remove('bd-drop-target');
    const dragged = this._dragId;
    this._dragId = null;
    if (!dragged || dragged === node.id) return;
    const draggedNode = this._tree.nodes.find((n) => n.id === dragged);
    if (node.type === 'folder' && draggedNode && draggedNode.type === 'bookmark') {
      await window.bookmarksAPI.move(dragged, node.id);
    } else {
      await this._tree.reorderTopLevel(dragged, node.id);
    }
    this._tree.reload();
  }
}
