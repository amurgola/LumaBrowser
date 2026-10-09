import CodeEditorLayout from './CodeEditorLayout.js';
import CodeWorkspace from './CodeWorkspace.js';
import EditorPane from './EditorPane.js';
import FileSaver from './FileSaver.js';
import DiskSync from './DiskSync.js';
import FileEntryActions from './FileEntryActions.js';
import AgentWriteFollower from './AgentWriteFollower.js';
import EditorContext from './EditorContext.js';
import ChatDock from './ChatDock.js';
import WorkspacePath from './WorkspacePath.js';

export default class CodeEditor {
  constructor({ chatMode = null } = {}) {
    this._chatMode = chatMode;
    this._root = null;
    this._ws = null;
    this._conversationId = null;
  }

  setChatMode(chatMode) {
    this._chatMode = chatMode;
  }

  mount(rootEl, api) {
    this._root = rootEl;
    this._build();
    this._ws.client.api = api;
  }

  async show(conversationId) {
    this._build();
    this._root.hidden = false;
    if (conversationId === this._conversationId) {
      this._sync.refresh(false);
      if (this._ws.editor) this._ws.editor.layout();
      return;
    }
    await this._openFolder(conversationId);
  }

  hide() {
    if (this._actions) this._actions.menu.close();
    if (this._root) this._root.hidden = true;
  }

  hasUnsaved() {
    return !!this._ws && this._ws.files.hasUnsaved();
  }

  wantsChatDock() {
    return ChatDock.wanted();
  }

  isDocked() {
    return !!this._root && !this._root.hidden && document.body.classList.contains('code-split');
  }

  openPath(path, line) {
    const rel = this._ws ? WorkspacePath.relativeTo(this._ws.folderRoot, path) : null;
    if (!rel) { if (this._ws) this._ws.status.show('That file is outside this folder.', 'error'); return; }
    this._pane.open(rel, { line });
  }

  insertAtCaret(text) {
    if (this._pane) this._pane.insertAtCaret(text);
  }

  _build() {
    if (this._ws) return;
    const els = CodeEditorLayout.build(this._root);
    this._ws = new CodeWorkspace(this._root, els, {
      onSave: () => this._saver.saveActive(),
      onAsk: () => this._sendToChat(this._editorContext(), true),
      onAddSelection: () => this._sendToChat(this._editorContext(), false),
    });
    this._pane = new EditorPane(this._ws);
    this._saver = new FileSaver(this._ws);
    this._sync = new DiskSync(this._ws);
    this._actions = new FileEntryActions(this._ws, this._pane, {
      sendToChat: (item, focus) => this._sendToChat(item, focus),
      contextFromPath: (path) => EditorContext.fromPath(path, this._ws.files, this._ws.client),
    });
    this._follower = new AgentWriteFollower(this._ws, this._pane, this._sync, (id) => !!this._conversationId && id === this._conversationId);
    this._wire(els);
  }

  _wire(els) {
    const b = els.buttons;
    ChatDock.paintButton(b.chat);
    b.newFile.addEventListener('click', () => this._actions.create('file'));
    b.newDir.addEventListener('click', () => this._actions.create('dir'));
    b.refresh.addEventListener('click', () => this._sync.refresh(true));
    b.save.addEventListener('click', () => this._saver.saveActive());
    b.diff.addEventListener('click', () => this._pane.toggleDiff());
    b.chat.addEventListener('click', () => ChatDock.setWanted(!ChatDock.wanted(), b.chat));
    window.addEventListener('luma-chat-tool', (e) => this._follower.onTool(e && e.detail));
    ChatDock.buildGrip(() => { if (this._ws.editor) this._ws.editor.layout(); });
    els.tree.addEventListener('click', (e) => this._onTreeClick(e));
    els.tree.addEventListener('contextmenu', (e) => this._actions.openMenu(e));
    els.tabs.addEventListener('click', (e) => this._onTabClick(e));
    this._root.addEventListener('keydown', (e) => this._onKeydown(e));
    window.addEventListener('resize', () => { if (this._ws.editor && !this._root.hidden) this._ws.editor.layout(); });
  }

  _onKeydown(e) {
    if (!((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S'))) return;
    e.preventDefault();
    if (e.shiftKey) this._saver.saveAll();
    else this._saver.saveActive();
  }

  _onTreeClick(e) {
    const row = e.target.closest('.ce-row');
    if (!row) return;
    if (row.dataset.type === 'dir') this._ws.tree.toggle(row.dataset.path, this._ws.files.activePath);
    else this._pane.open(row.dataset.path);
  }

  _onTabClick(e) {
    const close = e.target.closest('[data-close]');
    if (close) { this._pane.close(close.dataset.close); return; }
    const tab = e.target.closest('.ce-tab');
    if (tab) this._pane.activate(tab.dataset.path);
  }

  async _openFolder(conversationId) {
    const ws = this._ws;
    ws.reset();
    this._conversationId = conversationId;
    ws.client.conversationId = conversationId;
    ws.folderRoot = '';
    ws.label = '';
    ws.tree.showMessage('<div class="ce-empty">Loading…</div>');
    const info = await ws.client.call('info', {});
    if (!info || !info.success) {
      ws.tree.showMessage('');
      ws.status.show((info && info.error) || 'This conversation has no code folder.', 'error');
      return;
    }
    ws.folderRoot = info.root;
    ws.label = info.label || 'Code';
    ws.setTitle(ws.folderRoot);
    try { await ws.host.ensure(); } catch (err) { ws.status.show('Could not load the editor: ' + err.message, 'error'); }
    await ws.tree.listDir('');
    ws.renderTree();
    ws.updateButtons();
  }

  _editorContext() {
    const ws = this._ws;
    return EditorContext.fromEditor(ws.editor, ws.files.activePath, ws.files.active());
  }

  _sendToChat(item, focus) {
    const chat = this._chatMode;
    if (!item || !chat || !chat.addContext) { this._ws.status.show('Nothing to add to the chat here.', 'error'); return; }
    if (!ChatDock.wanted()) ChatDock.setWanted(true, this._ws.els.buttons.chat);
    chat.addContext(item, !!focus);
    if (!focus) this._ws.status.show('Added to the chat.', 'ok');
  }
}
