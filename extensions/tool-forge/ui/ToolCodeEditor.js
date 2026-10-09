import MonacoLoader from '../../../core/llm-server/ui/js/monaco/MonacoLoader.js';
import ToolCompletions from './ToolCompletions.js';

export default class ToolCodeEditor {
  static OPTIONS = {
    language: 'javascript',
    theme: 'luma-dark',
    automaticLayout: true,
    fontSize: 12.5,
    minimap: { enabled: false },
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    tabSize: 2,
  };

  constructor() {
    this._editor = null;
    this._completions = null;
  }

  isMounted() {
    return !!this._editor;
  }

  value() {
    if (!this._editor) return null;
    try { return this._editor.getValue(); } catch (_) { return null; }
  }

  async mount(host, tool, stillWanted) {
    const monaco = await MonacoLoader.ensureLoaded().catch(() => null);
    if (!monaco) {
      if (host.isConnected) host.innerHTML = '<div class="luma-error">Code editor unavailable.</div>';
      return;
    }
    if (!stillWanted() || !host.isConnected) return;
    this.dispose();
    this._editor = monaco.editor.create(host, { ...ToolCodeEditor.OPTIONS, value: (tool && tool.code) || '' });
    this._completions = ToolCompletions.register(monaco, tool);
  }

  dispose() {
    try { if (this._completions) this._completions.dispose(); } catch (_) {}
    try { if (this._editor) this._editor.dispose(); } catch (_) {}
    this._completions = null;
    this._editor = null;
  }
}
