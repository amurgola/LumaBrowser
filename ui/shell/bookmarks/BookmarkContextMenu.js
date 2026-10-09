export default class BookmarkContextMenu {
  static WIDTH = 200;

  constructor({ popupMenu, tabActions, nodeActions }) {
    this._menu = popupMenu;
    this._tabActions = tabActions;
    this._actions = nodeActions;
  }

  open(node, x, y) {
    const { items, map } = this.build(node);
    this._menu.open('context', items, map, { x, y, width: BookmarkContextMenu.WIDTH });
  }

  build(node) {
    const items = [];
    const map = {};
    const add = (action, label, fn, opts = {}) => { items.push(Object.assign({ action, label }, opts)); map[action] = fn; };
    const bookmark = node.type === 'bookmark';
    if (bookmark) {
      add('open', 'Open', () => { if (node.url) this._tabActions.navigate(node.url); });
      add('openNew', 'Open in new tab', () => { if (node.url) this._tabActions.create(node.url, { activate: true }); });
      items.push({ sep: true });
    }
    add('rename', 'Rename', () => this._actions.rename(node));
    if (bookmark) {
      add('editUrl', 'Edit URL', () => this._actions.editUrl(node));
      add('startup', 'Open on startup', () => this._actions.toggleStartup(node), { check: !!node.openOnStartup });
    }
    items.push({ sep: true });
    add('delete', node.type === 'folder' ? 'Delete folder' : 'Delete', () => this._actions.remove(node), { danger: true });
    return { items, map };
  }
}
