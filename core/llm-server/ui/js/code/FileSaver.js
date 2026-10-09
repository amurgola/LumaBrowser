export default class FileSaver {
  constructor(workspace) {
    this._ws = workspace;
  }

  async saveActive() {
    const files = this._ws.files;
    if (files.dirtyCount() > 1) return this.saveAll();
    const entry = files.activeText();
    if (!entry || !entry.dirty) return;
    await this._saveOne(files.activePath, entry, false);
  }

  async saveAll() {
    const targets = this._ws.files.entries().filter(([, f]) => f.dirty && !f.image);
    if (!targets.length) return;
    let failed = 0;
    for (const [path, entry] of targets) { if (!(await this._saveOne(path, entry, true))) failed += 1; }
    this._ws.status.show(failed ? `${targets.length - failed} saved, ${failed} failed.` : `Saved ${targets.length} files.`, failed ? 'error' : 'ok');
  }

  async _saveOne(path, entry, quiet) {
    const ws = this._ws;
    const text = entry.model.getValue();
    const r = await ws.client.call('write', { path, content: text });
    if (!r || !r.success) { ws.status.show((r && r.error) || 'Save failed.', 'error'); return false; }
    entry.savedText = text;
    entry.dirty = false;
    ws.renderTabs();
    ws.updateButtons();
    if (!quiet) ws.status.show('Saved ' + path, 'ok');
    return true;
  }
}
