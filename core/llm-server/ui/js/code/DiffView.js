export default class DiffView {
  static OPTIONS = {
    theme: 'luma-dark',
    automaticLayout: true,
    fontSize: 13,
    originalEditable: false,
    scrollBeyondLastLine: false,
    renderWhitespace: 'selection',
  };

  constructor({ diffHost, editorHost, getEditor }) {
    this._diffHost = diffHost;
    this._editorHost = editorHost;
    this._getEditor = getEditor;
    this._diffEditor = null;
    this._original = null;
    this.active = false;
  }

  show(monaco, beforeText, model) {
    if (!this._diffEditor) this._diffEditor = monaco.editor.createDiffEditor(this._diffHost, { ...DiffView.OPTIONS });
    this._disposeOriginal();
    this._original = monaco.editor.createModel(beforeText, model.getLanguageId());
    this._diffEditor.setModel({ original: this._original, modified: model });
    this.active = true;
    this._editorHost.hidden = true;
    this._diffHost.hidden = false;
    this._diffEditor.layout();
    requestAnimationFrame(() => { if (this.active && this._diffEditor) this._diffEditor.layout(); });
  }

  hide() {
    this.active = false;
    if (this._diffEditor) this._diffEditor.setModel(null);
    this._disposeOriginal();
    if (this._diffHost) this._diffHost.hidden = true;
    if (this._editorHost) this._editorHost.hidden = false;
    const editor = this._getEditor();
    if (editor) editor.layout();
  }

  _disposeOriginal() {
    if (!this._original) return;
    try { this._original.dispose(); } catch (_) {}
    this._original = null;
  }
}
