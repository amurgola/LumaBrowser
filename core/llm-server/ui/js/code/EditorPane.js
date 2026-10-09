import HtmlEscaper from '../format/HtmlEscaper.js';
import Dialogs from '../dialogs/Dialogs.js';
import MonacoLanguages from '../monaco/MonacoLanguages.js';

const esc = HtmlEscaper.escape;

export default class EditorPane {
  constructor(workspace) {
    this._ws = workspace;
  }

  async open(path, opts) {
    const o = opts || {};
    if (!this._ws.files.has(path) && !(await this._load(path))) return;
    this._land(path, o);
  }

  activate(path) {
    const ws = this._ws;
    const entry = ws.files.get(path);
    if (!entry) return;
    this._parkActive(path);
    ws.files.activePath = path;
    if (ws.diff.active) ws.hideDiff();
    if (entry.image) this._showImage(path, entry);
    else this._showText(entry);
    ws.renderTabs();
    ws.renderTree();
    ws.updateButtons();
    ws.setTitle(path);
  }

  close(path, force) {
    const ws = this._ws;
    const entry = ws.files.get(path);
    if (!entry) return;
    if (entry.dirty && !force) {
      Promise.resolve(Dialogs.confirm(`“${path}” has unsaved changes. Close it anyway?`)).then((ok) => { if (ok) this.close(path, true); });
      return;
    }
    if (ws.diff.active && ws.files.activePath === path) ws.hideDiff();
    ws.files.delete(path);
    if (ws.files.activePath === path) this._activateNext();
    ws.renderTabs();
    ws.renderTree();
    ws.updateButtons();
  }

  markDirty(path) {
    const entry = this._ws.files.get(path);
    if (!entry || entry.image) return;
    entry.dirty = entry.model.getValue() !== entry.savedText;
    this._ws.renderTabs();
    this._ws.updateButtons();
  }

  toggleDiff() {
    const ws = this._ws;
    if (ws.diff.active) { ws.hideDiff(); return; }
    const path = ws.files.activePath;
    const entry = ws.files.activeText();
    if (!entry || !ws.snapshots.has(path) || !ws.monaco) return;
    ws.diff.show(ws.monaco, ws.snapshots.get(path), entry.model);
    ws.updateButtons();
  }

  insertAtCaret(text) {
    const ws = this._ws;
    if (!ws.files.activeText() || !ws.editor || ws.diff.active) { ws.status.show('Open a file to insert into.', 'error'); return; }
    ws.editor.executeEdits('luma.insert', [{ range: ws.editor.getSelection(), text: String(text || ''), forceMoveMarkers: true }]);
    ws.editor.focus();
  }

  async _load(path) {
    const ws = this._ws;
    const r = await ws.client.call('read', { path });
    if (!r || !r.success) { ws.status.show((r && r.error) || 'Could not open that file.', 'error'); return false; }
    await ws.host.ensure();
    if (r.image) ws.files.set(path, { image: true, dataUrl: r.dataUrl, dirty: false });
    else ws.files.set(path, this._textEntry(path, r.content));
    return true;
  }

  _textEntry(path, content) {
    const ws = this._ws;
    let model;
    try { model = ws.monaco.editor.getModel(ws.uriFor(path)); } catch (_) { model = null; }
    if (model) model.setValue(content);
    else model = ws.monaco.editor.createModel(content, MonacoLanguages.resolveLanguage(null, path), ws.uriFor(path));
    const entry = { model, savedText: content, dirty: false, viewState: null };
    model.onDidChangeContent(() => {
      const dirty = model.getValue() !== entry.savedText;
      if (dirty !== entry.dirty) { entry.dirty = dirty; ws.renderTabs(); ws.updateButtons(); }
    });
    return entry;
  }

  _land(path, o) {
    const ws = this._ws;
    if (o.background && ws.files.activePath && ws.files.activePath !== path) { ws.renderTabs(); return; }
    this.activate(path);
    if (Number.isInteger(o.line) && o.line > 0 && ws.editor && !ws.files.get(path).image) {
      ws.editor.revealLineInCenter(o.line);
      ws.editor.setPosition({ lineNumber: o.line, column: 1 });
    }
  }

  _parkActive(nextPath) {
    const ws = this._ws;
    const current = ws.files.activePath;
    if (!current || current === nextPath) return;
    const prev = ws.files.get(current);
    if (prev && !prev.image && ws.editor) prev.viewState = ws.editor.saveViewState();
  }

  _showImage(path, entry) {
    const els = this._ws.els;
    els.editorHost.hidden = true;
    els.imageHost.hidden = false;
    els.imageHost.innerHTML = `<img src="${esc(entry.dataUrl)}" alt="${esc(path)}"><div class="ce-image-cap">${esc(path)} (preview only)</div>`;
  }

  _showText(entry) {
    const ws = this._ws;
    ws.els.imageHost.hidden = true;
    ws.els.editorHost.hidden = false;
    ws.editor.setModel(entry.model);
    if (entry.viewState) ws.editor.restoreViewState(entry.viewState);
    ws.editor.focus();
    ws.editor.layout();
  }

  _activateNext() {
    const ws = this._ws;
    ws.files.activePath = null;
    const next = ws.files.paths()[0];
    if (next) { this.activate(next); return; }
    if (ws.editor) ws.editor.setModel(null);
    ws.els.imageHost.hidden = true;
    ws.els.editorHost.hidden = false;
    ws.setTitle(ws.folderRoot);
  }
}
