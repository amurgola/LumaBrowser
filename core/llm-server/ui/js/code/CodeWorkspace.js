import HtmlEscaper from '../format/HtmlEscaper.js';
import EditorTabs from './EditorTabs.js';
import FileTree from './FileTree.js';
import OpenFiles from './OpenFiles.js';
import StatusLine from './StatusLine.js';
import WorkspaceClient from './WorkspaceClient.js';
import WorkspacePath from './WorkspacePath.js';
import WriteSnapshots from './WriteSnapshots.js';
import DiffView from './DiffView.js';
import MonacoEditorHost from './MonacoEditorHost.js';

const esc = HtmlEscaper.escape;

export default class CodeWorkspace {
  constructor(root, els, handlers) {
    this.root = root;
    this.els = els;
    this.folderRoot = '';
    this.label = '';
    this.client = new WorkspaceClient();
    this.status = new StatusLine(els.status);
    this.tree = new FileTree({ element: els.tree, client: this.client, status: this.status, onRoot: (r) => { this.folderRoot = r; } });
    this.files = new OpenFiles();
    this.snapshots = new WriteSnapshots();
    this.host = new MonacoEditorHost(els.editorHost, handlers);
    this.diff = new DiffView({ diffHost: els.diffHost, editorHost: els.editorHost, getEditor: () => this.host.editor });
  }

  get editor() {
    return this.host.editor;
  }

  get monaco() {
    return this.host.monaco;
  }

  isShowing() {
    return !!this.root && !this.root.hidden;
  }

  uriFor(path) {
    return this.monaco.Uri.file(WorkspacePath.normalizedRoot(this.folderRoot) + '/' + path);
  }

  setTitle(pathText) {
    this.els.title.innerHTML = `<b>${esc(this.label || 'Code')}</b><span class="ce-path">${esc(pathText)}</span>`;
  }

  renderTabs() {
    EditorTabs.render(this.els.tabs, this.files);
  }

  renderTree() {
    this.tree.render(this.files.activePath);
  }

  updateButtons() {
    this._updateDiffButton();
    const dirty = this.files.dirtyCount();
    this.els.buttons.save.textContent = dirty > 1 ? `Save all (${dirty})` : 'Save';
    this.els.buttons.save.disabled = dirty === 0;
  }

  reset() {
    if (this.diff.active) this.hideDiff();
    this.snapshots.clear();
    this.files.clear();
    this.tree.clear();
    if (this.editor) this.editor.setModel(null);
    this.els.tabs.innerHTML = '';
    this.els.tabs.hidden = true;
    this.els.imageHost.hidden = true;
    this.els.imageHost.innerHTML = '';
    this.els.editorHost.hidden = false;
  }

  hideDiff() {
    this.diff.hide();
    this._updateDiffButton();
  }

  _updateDiffButton() {
    const button = this.els.buttons.diff;
    const path = this.files.activePath;
    const entry = this.files.activeText();
    const has = !!entry && this.snapshots.has(path) && this.snapshots.get(path) !== entry.model.getValue();
    button.disabled = !has && !this.diff.active;
    button.classList.toggle('active', this.diff.active);
  }
}
