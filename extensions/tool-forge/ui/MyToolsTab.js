import Dialogs from '../../../core/llm-server/ui/js/dialogs/Dialogs.js';
import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import ToolCodeEditor from './ToolCodeEditor.js';
import ToolEditView from './ToolEditView.js';
import ToolListView from './ToolListView.js';

export default class MyToolsTab {
  static CSS_ID = 'tf-css';
  static CSS_HREF = '/llm-ui/ext/tool-forge/setup-ui.css';
  static RESULT_PREVIEW_CHARS = 600;

  constructor(el, api) {
    this._el = el;
    this._api = api;
    this._tools = [];
    this._encryptionAvailable = true;
    this._view = 'list';
    this._editing = null;
    this._editSlots = [];
    this._canPublish = false;
    this._notice = null;
    this._editor = new ToolCodeEditor();
  }

  mount() {
    MyToolsTab._injectCss();
    this._el.classList.add('luma-setup');
    return this.refresh();
  }

  async refresh() {
    try {
      const r = await this._inv('list');
      this._tools = (r && r.tools) || [];
      this._encryptionAvailable = !!(r && r.encryptionAvailable);
    } catch (e) {
      this._el.innerHTML = '<div class="luma-error">Failed to load tools: ' + HtmlEscaper.escape(e.message) + '</div>';
      return;
    }
    this._render();
  }

  async openEditor(name) {
    let full;
    try {
      full = (await this._inv('get', { name })).tool;
    } catch (e) {
      this._notice = { kind: 'warn', text: 'Could not open tool: ' + e.message };
      this._render();
      return;
    }
    this._editing = full;
    this._editSlots = (full.configSlots || []).map((s) => ({ ...s }));
    this._canPublish = !!(full.lastTest && full.lastTest.ok);
    this._view = 'edit';
    this._notice = null;
    this._render();
    await this._mountEditor();
  }

  closeEditor() {
    this._editor.dispose();
    this._editing = null;
    this._editSlots = [];
    this._canPublish = false;
    this._view = 'list';
    return this.refresh();
  }

  async saveTool() {
    try {
      const res = await this._saveDraft();
      if (res && res.success) this._notice = { kind: 'ok', text: 'Saved as a draft (v' + res.version + '). Test it, then publish.' };
    } catch (e) {
      this._notice = { kind: 'warn', text: e.message };
    }
    await this._rerender();
  }

  async testTool() {
    const args = this._testArgs();
    if (!args) { await this._rerender(); return; }
    try {
      const saved = await this._saveDraft();
      if (!saved || !saved.success) { await this._rerender(); return; }
      const res = await this._inv('test', { name: this._editing.name, args: args.value });
      this._canPublish = !!res.success;
      this._notice = res.success
        ? { kind: 'ok', title: 'Test passed', lines: [MyToolsTab._truncate(res.result, MyToolsTab.RESULT_PREVIEW_CHARS)] }
        : { kind: 'warn', title: 'Test failed', lines: [res.error || 'unknown error'] };
    } catch (e) {
      this._notice = { kind: 'warn', text: e.message };
    }
    await this._rerender();
  }

  async publishTool() {
    try {
      const res = await this._inv('publish', { name: this._editing.name });
      if (res.success) {
        this._editing = { ...this._editing, status: 'published' };
        this._notice = { kind: 'ok', text: 'Published and enabled. The chat can call it now; the gear panel toggles it per chat.' };
      } else {
        this._notice = { kind: 'warn', text: res.error || 'Publish failed' };
      }
    } catch (e) {
      this._notice = { kind: 'warn', text: e.message };
    }
    await this._rerender();
  }

  async saveSettings() {
    try {
      await this._inv('config.set', { name: this._editing.name, values: ToolEditView.collectSettings(this._el) });
      this._notice = { kind: 'ok', text: 'Saved configuration.' };
      await this._reloadConfig();
    } catch (e) {
      this._notice = { kind: 'warn', text: e.message };
    }
    await this._rerender();
  }

  async exportTool(name) {
    this._notice = null;
    try {
      const r = await this._inv('export', { name });
      if (r.canceled) return;
      this._notice = { kind: 'ok', text: 'Exported to ' + r.filePath };
    } catch (e) {
      this._notice = { kind: 'warn', text: 'Export failed: ' + e.message };
    }
    this._render();
  }

  async importTool() {
    this._notice = null;
    try {
      const r = await this._inv('import');
      if (r.canceled) return;
      this._notice = {
        kind: r.warnings && r.warnings.length ? 'warn' : 'ok',
        title: 'Imported "' + r.name + '"',
        lines: r.warnings || [],
      };
    } catch (e) {
      this._notice = { kind: 'warn', text: 'Import failed: ' + e.message };
    }
    await this.refresh();
  }

  async deleteTool(name) {
    if (!(await Dialogs.confirm('Delete the tool "' + name + '"? This removes its code and configuration.'))) return;
    try {
      await this._inv('delete', { name });
      this._notice = { kind: 'ok', text: 'Deleted "' + name + '".' };
      await this.refresh();
    } catch (e) {
      this._notice = { kind: 'warn', text: 'Delete failed: ' + e.message };
      this._render();
    }
  }

  async _inv(action, payload) {
    const r = await this._api.invoke(action, payload);
    if (!r || !r.success) throw new Error((r && r.error) || (action + ' failed'));
    return r.result;
  }

  async _saveDraft() {
    this._captureCode();
    let patch;
    try {
      patch = ToolEditView.collectPatch(this._el, this._editSlots, this._currentCode());
    } catch (e) {
      this._notice = { kind: 'warn', text: e.message };
      return null;
    }
    const res = await this._inv('save', { name: this._editing.name, patch });
    if (res.success) {
      this._editing = { ...this._editing, ...patch, status: 'draft', version: res.version };
      this._canPublish = false;
    } else {
      this._notice = { kind: 'warn', text: res.error || 'Save failed', lines: (res.diagnostics || []).map(MyToolsTab._diagnostic) };
    }
    return res;
  }

  _testArgs() {
    const text = this._el.querySelector('[name=tf-testargs]').value.trim();
    if (!text) return { value: {} };
    try {
      return { value: JSON.parse(text) };
    } catch (e) {
      this._notice = { kind: 'warn', text: 'Test args are not valid JSON: ' + e.message };
      return null;
    }
  }

  async _reloadConfig() {
    try {
      const config = (await this._inv('get', { name: this._editing.name })).tool.config;
      this._editing = { ...this._editing, config };
    } catch (_) {}
  }

  _captureCode() {
    const code = this._editor.value();
    if (code !== null && this._editing) this._editing = { ...this._editing, code };
  }

  _currentCode() {
    const code = this._editor.value();
    return code !== null ? code : (this._editing.code || '');
  }

  _render() {
    this._el.innerHTML = '';
    if (this._view === 'edit' && this._editing) this._renderEdit();
    else this._renderList();
  }

  async _rerender() {
    if (this._view === 'edit') this._captureCode();
    this._render();
    if (this._view === 'edit') await this._mountEditor();
  }

  _renderList() {
    ToolListView.render(this._el, {
      tools: this._tools, encryptionAvailable: this._encryptionAvailable, notice: this._notice,
    }, {
      importTool: () => this.importTool(),
      edit: (name) => this.openEditor(name),
      exportTool: (name) => this.exportTool(name),
      deleteTool: (name) => this.deleteTool(name),
      dismiss: () => { this._notice = null; this._rerender(); },
    });
  }

  _renderEdit() {
    ToolEditView.render(this._el, {
      tool: this._editing, slots: this._editSlots, canPublish: this._canPublish, notice: this._notice,
    }, {
      back: () => this.closeEditor(),
      dismiss: () => { this._notice = null; this._rerender(); },
      saveSettings: () => this.saveSettings(),
      test: () => this.testTool(),
      save: () => this.saveTool(),
      publish: () => this.publishTool(),
    });
  }

  async _mountEditor() {
    const host = this._el.querySelector('[data-tf-editor]');
    if (!host) return;
    await this._editor.mount(host, this._editing, () => this._view === 'edit');
  }

  static _diagnostic(d) {
    return (d.line ? 'L' + d.line + ': ' : '') + (d.message || '');
  }

  static _truncate(s, n) {
    const str = String(s == null ? '' : s);
    return str.length > n ? str.slice(0, n) + '…' : str;
  }

  static _injectCss() {
    if (document.getElementById(MyToolsTab.CSS_ID)) return;
    const link = document.createElement('link');
    link.id = MyToolsTab.CSS_ID;
    link.rel = 'stylesheet';
    link.href = MyToolsTab.CSS_HREF;
    document.head.appendChild(link);
  }
}
