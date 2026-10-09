import Dialogs from '../dialogs/Dialogs.js';
import TreeMenu from './TreeMenu.js';
import WorkspacePath from './WorkspacePath.js';

export default class FileEntryActions {
  constructor(workspace, pane, { sendToChat, contextFromPath }) {
    this._ws = workspace;
    this._pane = pane;
    this._sendToChat = sendToChat;
    this._contextFromPath = contextFromPath;
    this.menu = new TreeMenu(workspace.root);
  }

  async create(kind, dir) {
    const ws = this._ws;
    const base = dir == null ? this._defaultDir() : dir;
    const name = await Dialogs.prompt(kind === 'dir' ? 'New folder name' : 'New file name', '');
    if (!name) return;
    const path = WorkspacePath.join(base, name);
    const r = await ws.client.call('create', { path, kind });
    if (!r || !r.success) { ws.status.show((r && r.error) || 'Could not create it.', 'error'); return; }
    await ws.tree.reveal(WorkspacePath.parentOf(path));
    await ws.tree.refreshListed();
    ws.renderTree();
    if (kind !== 'dir') this._pane.open(path);
    ws.status.show(kind === 'dir' ? 'Folder created.' : 'File created.');
  }

  async rename(path) {
    const ws = this._ws;
    const current = WorkspacePath.baseName(path);
    const name = await Dialogs.prompt('Rename to', current);
    if (!name || name === current) return;
    const to = WorkspacePath.join(WorkspacePath.parentOf(path), name);
    const r = await ws.client.call('rename', { path, to });
    if (!r || !r.success) { ws.status.show((r && r.error) || 'Could not rename it.', 'error'); return; }
    if (await this._carryOver(path, to)) return;
    await ws.tree.refreshListed();
    ws.renderTree();
    ws.status.show('Renamed.');
  }

  async remove(path, isDir) {
    const ws = this._ws;
    const ok = await Dialogs.confirm(isDir ? `Delete the folder “${path}” and everything in it?` : `Delete “${path}”?`);
    if (!ok) return;
    const r = await ws.client.call('remove', { path });
    if (!r || !r.success) { ws.status.show((r && r.error) || 'Could not delete it.', 'error'); return; }
    for (const open of ws.files.paths()) { if (WorkspacePath.isWithin(open, path)) this._pane.close(open, true); }
    ws.tree.forget(path);
    await ws.tree.refreshListed();
    ws.renderTree();
    ws.status.show('Deleted.');
  }

  openMenu(e) {
    const row = e.target.closest('.ce-row');
    e.preventDefault();
    this.menu.close();
    const target = row ? row.dataset.path : '';
    const isDir = row ? row.dataset.type === 'dir' : true;
    const dir = isDir ? target : WorkspacePath.parentOf(target);
    const items = [
      { label: 'New file', run: () => this.create('file', dir) },
      { label: 'New folder', run: () => this.create('dir', dir) },
    ];
    if (row && !isDir) items.push({ label: 'Add to chat', run: async () => this._sendToChat(await this._contextFromPath(target), false) });
    if (row) {
      items.push({ label: 'Rename', run: () => this.rename(target) });
      items.push({ label: 'Delete', run: () => this.remove(target, isDir), danger: true });
    }
    this.menu.open(e.clientX, e.clientY, items);
  }

  _defaultDir() {
    const active = this._ws.files.activePath;
    return active ? WorkspacePath.parentOf(active) : '';
  }

  async _carryOver(from, to) {
    const ws = this._ws;
    const open = ws.files.get(from);
    if (!open) return false;
    const text = open.image ? null : open.model.getValue();
    this._pane.close(from, true);
    if (text == null) return false;
    await ws.tree.refreshListed();
    ws.renderTree();
    await this._pane.open(to);
    const next = ws.files.get(to);
    if (next && next.model.getValue() !== text) { next.model.setValue(text); this._pane.markDirty(to); }
    return true;
  }
}
