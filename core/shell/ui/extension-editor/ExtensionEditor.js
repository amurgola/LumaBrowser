import CompletionProvider from './completions/CompletionProvider.js';
import EditorBridge from './EditorBridge.js';
import EditorFiles from './EditorFiles.js';
import EditorMonaco from './EditorMonaco.js';
import EditorStatus from './EditorStatus.js';
import FileTree from './FileTree.js';

export default class ExtensionEditor {
  constructor(win, doc, parts = {}) {
    this._win = win;
    this._doc = doc;
    const params = new URLSearchParams(win.location.search);
    this._extensionDir = params.get('dir') || '';
    this._extensionId = params.get('id') || 'unknown';
    this._bridge = parts.bridge || EditorBridge.fromWindow(win);
    this._loadMonaco = parts.loadMonaco || (() => EditorMonaco.load(win));
    this._status = new EditorStatus(doc.getElementById('statusText'));
    this._tree = new FileTree(doc.getElementById('fileTree'));
    this._files = null;
  }

  async start() {
    this._doc.getElementById('extName').textContent = this._extensionId;
    this._wireSaving();
    const monaco = await this._loadMonaco();
    this._createEditor(monaco);
    await Promise.all([this.loadFileTree(), this.loadAutocomplete(monaco)]);
  }

  async loadFileTree() {
    try {
      const files = await this._bridge.listFiles();
      this._tree.render(files, (file) => this.openFile(file));
      if (files.includes('manifest.js')) await this.openFile('manifest.js');
    } catch (e) {
      console.error('Failed to load file tree:', e);
      this._status.error('Error loading files');
    }
  }

  async openFile(fileName) {
    try {
      await this._files.open(fileName);
      this._tree.markActive(fileName);
      this._status.show(fileName);
    } catch (e) {
      console.error('Failed to open file:', e);
      this._status.error('Error opening file');
    }
  }

  async loadAutocomplete(monaco) {
    try {
      const data = await this._bridge.autocompleteData();
      if (data) {
        new CompletionProvider(monaco, { data, extensionId: this._extensionId, currentFile: () => this._files.currentFile }).register();
      }
      this._status.note('Autocomplete ready');
    } catch (e) {
      console.error('Failed to load autocomplete data:', e);
      this._status.note('Autocomplete unavailable');
    }
  }

  async save() {
    if (!this._files) return;
    try {
      const fileName = await this._files.saveCurrent();
      if (fileName) this._status.show(`${fileName} saved`);
    } catch (e) {
      this._win.alert('Save failed: ' + e.message);
      this._status.error('Save failed');
    }
  }

  async saveAll() {
    const saved = this._files ? await this._files.saveAll() : 0;
    this._status.show(`${saved} file(s) saved`);
  }

  _createEditor(monaco) {
    const editor = EditorMonaco.createEditor(monaco, this._doc.getElementById('editorContainer'));
    this._files = new EditorFiles({ monaco, editor, bridge: this._bridge, extensionDir: this._extensionDir });
  }

  _wireSaving() {
    this._doc.getElementById('saveBtn').addEventListener('click', () => this.save());
    this._doc.getElementById('saveAllBtn').addEventListener('click', () => this.saveAll());
    this._win.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this._doc.getElementById('saveBtn').click();
      }
    });
  }
}
