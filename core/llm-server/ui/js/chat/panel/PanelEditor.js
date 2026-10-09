import MonacoLoader from '../../monaco/MonacoLoader.js';
import MonacoLanguages from '../../monaco/MonacoLanguages.js';

export default class PanelEditor {
  static PREVIEW_DEBOUNCE_MS = 250;

  static OPTIONS = {
    theme: 'luma-dark',
    readOnly: true,
    automaticLayout: true,
    fontSize: 12.5,
    minimap: { enabled: false },
    lineNumbers: 'on',
    wordWrap: 'on',
    scrollBeyondLastLine: false,
    renderLineHighlight: 'none',
    guides: { indentation: false },
  };

  constructor(ctx) {
    this._ctx = ctx;
    this._editor = null;
    this._ready = null;
    this._writing = false;
    this._previewTimer = null;
  }

  ensure() {
    if (this._ready) return this._ready;
    this._ready = MonacoLoader.ensureLoaded().then((monaco) => this._create(monaco)).catch(() => null);
    return this._ready;
  }

  async write(text, language) {
    const ed = await this.ensure();
    if (!ed || !window.monaco) return;
    const model = ed.getModel();
    if (!model) return;
    this._setLanguage(model, MonacoLanguages.languageFor(language));
    if (model.getValue() === text) return;
    this._writing = true;
    try { ed.setValue(text || ''); } finally { this._writing = false; }
    try { ed.revealLine(model.getLineCount()); } catch (_) {}
  }

  async setReadOnly(readOnly) {
    const ed = await this.ensure();
    if (!ed) return;
    try { ed.updateOptions({ readOnly: !!readOnly }); } catch (_) {}
  }

  relayoutSoon() {
    if (!this._editor) return;
    setTimeout(() => { try { this._editor.layout(); } catch (_) {} }, 0);
  }

  revealTop() {
    try { if (this._editor) { this._editor.revealLine(1); this._editor.setScrollTop(0); } } catch (_) {}
  }

  _create(monaco) {
    if (!monaco) return null;
    const host = this._ctx.els.panel.querySelector('[data-monaco-host]');
    if (!host) return null;
    this._editor = monaco.editor.create(host, { ...PanelEditor.OPTIONS });
    this._editor.onDidChangeModelContent(() => this._onUserEdit());
    return this._editor;
  }

  _setLanguage(model, want) {
    if (window.monaco.editor.setModelLanguage && model.getLanguageId() !== want) {
      window.monaco.editor.setModelLanguage(model, want);
    }
  }

  _onUserEdit() {
    const panel = this._ctx.state.panel;
    if (!panel || panel.type !== 'html' || this._writing) return;
    this._schedulePreview();
  }

  _schedulePreview() {
    if (this._previewTimer) return;
    this._previewTimer = setTimeout(() => {
      this._previewTimer = null;
      const panel = this._ctx.state.panel;
      if (!this._editor || !panel || panel.type !== 'html') return;
      const src = this._editor.getModel() ? this._editor.getModel().getValue() : '';
      const frame = this._ctx.els.panel.querySelector('.cm-ap-frame');
      if (frame) {
        frame.removeAttribute('src');
        frame.srcdoc = src;
      }
    }, PanelEditor.PREVIEW_DEBOUNCE_MS);
  }
}
