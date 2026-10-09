export default class BookmarkTree {
  constructor() {
    this.nodes = [];
    this.suppressRefresh = false;
    this._listeners = [];
  }

  onChange(fn) {
    this._listeners.push(fn);
  }

  async reload() {
    if (!window.bookmarksAPI) return;
    try {
      this.nodes = await window.bookmarksAPI.getTree();
    } catch (e) {
      this.nodes = [];
      console.warn('load bookmarks failed:', e.message);
    }
    for (const fn of this._listeners) fn();
  }

  findByUrl(url) {
    return BookmarkTree.find(this.nodes, (n) => n.type === 'bookmark' && n.url === url);
  }

  findById(id) {
    return BookmarkTree.find(this.nodes, (n) => n.id === id);
  }

  folders() {
    return this.nodes.filter((n) => n.type === 'folder');
  }

  urls() {
    const urls = [];
    const collect = (nodes) => { for (const n of nodes || []) { if (n.url) urls.push(n.url); if (n.children) collect(n.children); } };
    collect(this.nodes);
    return urls;
  }

  static find(nodes, match) {
    for (const n of nodes || []) {
      if (match(n)) return n;
      if (n.type === 'folder') {
        const hit = BookmarkTree.find(n.children, match);
        if (hit) return hit;
      }
    }
    return null;
  }

  async reorderTopLevel(draggedId, beforeId) {
    const order = this.nodes.map((n) => n.id).filter((id) => id !== draggedId);
    const idx = order.indexOf(beforeId);
    if (idx < 0) order.push(draggedId); else order.splice(idx, 0, draggedId);
    this.suppressRefresh = true;
    try {
      for (let i = 0; i < order.length; i++) await window.bookmarksAPI.move(order[i], null, i);
    } finally {
      this.suppressRefresh = false;
    }
  }
}
