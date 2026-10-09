import Dialogs from '../../../core/llm-server/ui/js/dialogs/Dialogs.js';
import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import AgentCard from './AgentCard.js';
import AgentForm from './AgentForm.js';
import AgentKnowledgeSection from './AgentKnowledgeSection.js';
import AgentNotice from './AgentNotice.js';

export default class AgentsTab {
  static CSS_ID = 'am-css';
  static CSS_HREF = '/llm-ui/ext/agent-manager/setup-ui.css';

  static HEAD_HTML = '<div><h2 class="luma-title">Agents</h2>'
    + '<p class="luma-sub">Build focused sub-agents the chat can delegate to. '
    + 'Each agent has its own system prompt, tools, and model. Give chat access '
    + 'to <code>list_agents</code> + <code>chat_with_agent</code> in the Tools menu '
    + 'to let it use them.</p></div>';

  constructor(el, api) {
    this._el = el;
    this._api = api;
    this._agents = [];
    this._toolGroups = [];
    this._models = [];
    this._defaultRef = null;
    this._editing = null;
    this._formOpen = false;
    this._kbDocs = [];
    this._notice = null;
  }

  mount() {
    AgentsTab._injectCss();
    this._el.classList.add('luma-setup');
    return this.refresh();
  }

  async refresh() {
    try {
      const [ag, tg, ml] = await Promise.all([this._inv('list'), this._inv('tools'), this._api.llmDiagAPI.listModels()]);
      this._agents = (ag && ag.agents) || [];
      this._toolGroups = (tg && tg.groups) || [];
      this._models = (ml && ml.models) || [];
      this._defaultRef = (ml && ml.defaultRef) || null;
    } catch (e) {
      this._agents = [];
      this._toolGroups = [];
      this._models = [];
      this._el.innerHTML = '<div class="luma-error">Failed to load agents: ' + HtmlEscaper.escape(e.message) + '</div>';
      return;
    }
    this._render();
  }

  async openForm(agent) {
    this._editing = agent || null;
    this._formOpen = true;
    this._kbDocs = agent ? await this._loadDocs(agent.id) : [];
    this._render();
  }

  closeForm() {
    this._editing = null;
    this._formOpen = false;
    this._kbDocs = [];
    this._render();
  }

  async saveForm(form) {
    const errBox = form.querySelector('.luma-form-err');
    errBox.textContent = '';
    const { patch, error } = AgentForm.collect(form);
    if (error) { errBox.textContent = error; return; }
    try {
      if (this._editing) await this._inv('update', { id: this._editing.id, patch });
      else await this._inv('create', patch);
      this.closeForm();
      await this.refresh();
    } catch (e) {
      errBox.textContent = e.message;
    }
  }

  async deleteAgent(id) {
    try {
      await this._inv('delete', { id });
      await this.refresh();
    } catch (e) {
      await Dialogs.alert('Delete failed: ' + e.message);
    }
  }

  async exportAgent(a) {
    this._notice = null;
    try {
      const r = await this._inv('export', { id: a.id });
      if (r.canceled) return;
      this._notice = { kind: 'ok', title: 'Exported "' + a.name + '" to ' + r.filePath, lines: [] };
    } catch (e) {
      this._notice = { kind: 'warn', title: 'Export failed', lines: [e.message] };
    }
    this._render();
  }

  async importAgent() {
    this._notice = null;
    try {
      const r = await this._inv('import');
      if (r.canceled) return;
      const docCount = (r.kb && r.kb.documents) || 0;
      const warnings = r.warnings || [];
      this._notice = {
        kind: warnings.length ? 'warn' : 'ok',
        title: 'Imported "' + r.agent.name + '"' + (docCount ? ' with ' + AgentCard.plural(docCount, 'knowledge doc') : ''),
        lines: warnings,
      };
      await this.refresh();
    } catch (e) {
      this._notice = { kind: 'warn', title: 'Import failed', lines: [e.message] };
      this._render();
    }
  }

  modelLabel(ref) {
    if (!ref) return 'App default';
    const m = this._models.find((x) => x.ref === ref);
    return m ? m.label : ref;
  }

  async _inv(action, payload) {
    const r = await this._api.invoke(action, payload);
    if (!r || !r.success) throw new Error((r && r.error) || (action + ' failed'));
    return r.result;
  }

  async _loadDocs(agentId) {
    try {
      return (await this._inv('kb.list', { agentId })).documents || [];
    } catch (_) {
      return [];
    }
  }

  _render() {
    this._el.innerHTML = '';
    this._el.appendChild(this._head());
    if (this._notice) this._el.appendChild(AgentNotice.render(this._notice, () => { this._notice = null; this._render(); }));
    if (this._formOpen) this._el.appendChild(this._form());
    this._el.appendChild(this._list());
  }

  _head() {
    const head = document.createElement('div');
    head.className = 'luma-head';
    head.innerHTML = AgentsTab.HEAD_HTML;
    const btns = document.createElement('div');
    btns.className = 'am-head-actions';
    btns.appendChild(AgentsTab._button('luma-btn', 'Import agent…', () => this.importAgent()));
    btns.appendChild(AgentsTab._button('luma-btn primary', 'Create an agent', () => this.openForm(null)));
    head.appendChild(btns);
    return head;
  }

  _form() {
    const form = AgentForm.render({
      agent: this._editing,
      models: this._models,
      defaultRef: this._defaultRef,
      toolGroups: this._toolGroups,
      modelLabel: (ref) => this.modelLabel(ref),
    }, { cancel: () => this.closeForm(), submit: (f) => this.saveForm(f) });
    new AgentKnowledgeSection({
      wrap: form.querySelector('.am-kb'),
      errBox: form.querySelector('.luma-form-err'),
      agent: this._editing,
      docs: this._kbDocs,
      inv: (action, payload) => this._inv(action, payload),
      onDocsChanged: (docs) => this._syncKbCount(docs),
    }).render();
    return form;
  }

  _syncKbCount(docs) {
    this._kbDocs = docs;
    if (!this._editing) return;
    const row = this._agents.find((x) => x.id === this._editing.id);
    if (row) row.kbDocs = docs.length;
  }

  _list() {
    const list = document.createElement('div');
    list.className = 'luma-list';
    if (!this._agents.length && !this._formOpen) {
      list.innerHTML = '<div class="luma-empty">No agents yet. Click “Create an agent” to add one.</div>';
    }
    const on = {
      edit: (a) => this.openForm(a),
      exportAgent: (a) => this.exportAgent(a),
      deleteAgent: (id) => this.deleteAgent(id),
    };
    for (const a of this._agents) list.appendChild(AgentCard.render(a, this.modelLabel(a.modelRef), on));
    return list;
  }

  static _button(cls, label, onClick) {
    const btn = document.createElement('button');
    btn.className = cls;
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    return btn;
  }

  static _injectCss() {
    if (document.getElementById(AgentsTab.CSS_ID)) return;
    const link = document.createElement('link');
    link.id = AgentsTab.CSS_ID;
    link.rel = 'stylesheet';
    link.href = AgentsTab.CSS_HREF;
    document.head.appendChild(link);
  }
}
