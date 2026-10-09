export default class DiskSync {
  constructor(workspace) {
    this._ws = workspace;
  }

  async refresh(explicit) {
    const ws = this._ws;
    await ws.tree.refreshListed();
    ws.renderTree();
    const conflicts = await this._reloadOpenFiles();
    ws.renderTabs();
    ws.updateButtons();
    if (conflicts.length) ws.status.show(`Changed on disk while you were editing: ${conflicts.join(', ')}`, 'error');
    else if (explicit) ws.status.show('Up to date.', 'ok');
  }

  async _reloadOpenFiles() {
    const conflicts = [];
    for (const [path, entry] of this._ws.files.entries()) {
      if (entry.image) continue;
      const r = await this._ws.client.call('read', { path });
      if (!r || !r.success || r.content === entry.savedText) continue;
      if (entry.dirty) { conflicts.push(path); continue; }
      this._replace(path, entry, r.content);
    }
    return conflicts;
  }

  _replace(path, entry, content) {
    const ws = this._ws;
    const isActive = path === ws.files.activePath && ws.editor;
    const view = isActive ? ws.editor.saveViewState() : entry.viewState;
    entry.model.setValue(content);
    entry.savedText = content;
    entry.dirty = false;
    if (isActive && view) ws.editor.restoreViewState(view);
  }
}
