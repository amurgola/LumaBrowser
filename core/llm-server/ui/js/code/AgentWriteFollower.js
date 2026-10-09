import WorkspacePath from './WorkspacePath.js';

export default class AgentWriteFollower {
  static WRITE_TOOLS = ['write_file', 'edit_file'];

  constructor(workspace, pane, sync, isActiveFor) {
    this._ws = workspace;
    this._pane = pane;
    this._sync = sync;
    this._isActiveFor = isActiveFor;
  }

  async onTool(detail) {
    const d = detail || {};
    if (!this._isActiveFor(d.conversationId) || !AgentWriteFollower.WRITE_TOOLS.includes(d.tool)) return;
    const path = WorkspacePath.relativeTo(this._ws.folderRoot, d.params && d.params.path);
    if (!path) return;
    if (await this._ws.snapshots.record(path, d.phase, () => this._currentText(path))) return;
    if (!d.success) return;
    await this._sync.refresh(false);
    if (!this._ws.isShowing()) return;
    await this._pane.open(path, { background: this._userIsEditingAnother(path) });
    this._ws.updateButtons();
  }

  async _currentText(path) {
    const open = this._ws.files.get(path);
    if (open) return open.image ? '' : open.savedText;
    const r = await this._ws.client.call('read', { path });
    return r && r.success && !r.image ? String(r.content || '') : '';
  }

  _userIsEditingAnother(path) {
    const files = this._ws.files;
    const active = files.activePath;
    return !!(active && active !== path && files.get(active) && files.get(active).dirty);
  }
}
