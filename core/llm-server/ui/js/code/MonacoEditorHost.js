import MonacoLoader from '../monaco/MonacoLoader.js';

export default class MonacoEditorHost {
  static OPTIONS = {
    theme: 'luma-dark',
    automaticLayout: true,
    fontSize: 13,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    renderWhitespace: 'selection',
    tabSize: 2,
    wordWrap: 'off',
    smoothScrolling: true,
  };

  constructor(host, handlers, loader = MonacoLoader) {
    this._host = host;
    this._handlers = handlers;
    this._loader = loader;
    this.monaco = null;
    this.editor = null;
  }

  async ensure() {
    if (this.editor) return this.editor;
    this.monaco = await this._loader.ensureLoaded();
    this.editor = this.monaco.editor.create(this._host, { ...MonacoEditorHost.OPTIONS });
    this._bindCommands(this.monaco, this.editor);
    return this.editor;
  }

  _bindCommands(monaco, editor) {
    const { KeyMod, KeyCode } = monaco;
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyS, () => this._handlers.onSave());
    editor.addAction({
      id: 'luma.ask',
      label: 'Ask Luma About Selection',
      keybindings: [KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.KeyL],
      contextMenuGroupId: '9_luma',
      contextMenuOrder: 1,
      run: () => this._handlers.onAsk(),
    });
    editor.addAction({
      id: 'luma.addSelection',
      label: 'Add Selection to Chat',
      keybindings: [KeyMod.CtrlCmd | KeyMod.Alt | KeyMod.Shift | KeyCode.KeyL],
      precondition: 'editorHasSelection',
      contextMenuGroupId: '9_luma',
      contextMenuOrder: 2,
      run: () => this._handlers.onAddSelection(),
    });
  }
}
