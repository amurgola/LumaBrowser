import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import AgentCard from './AgentCard.js';

export default class AgentKnowledgeSection {
  constructor({ wrap, errBox, agent, docs, inv, onDocsChanged }) {
    this._wrap = wrap;
    this._errBox = errBox;
    this._agent = agent;
    this._docs = docs;
    this._inv = inv;
    this._onDocsChanged = onDocsChanged;
  }

  render() {
    if (!this._agent) {
      this._wrap.innerHTML = '<div class="luma-empty">Save the agent first, then edit it to add knowledge documents.</div>';
      return;
    }
    this._wrap.innerHTML = this._listHtml()
      + '<div class="am-kb-actions"><button type="button" class="luma-btn" data-kb-add>Add documents…</button></div>';
    this._wrap.querySelector('[data-kb-add]').addEventListener('click', () => this.add());
    this._wrap.querySelectorAll('[data-kb-remove]').forEach((btn) => {
      btn.addEventListener('click', () => this.remove(Number(btn.dataset.kbRemove)));
    });
  }

  async add() {
    this._errBox.textContent = '';
    try {
      const r = await this._inv('kb.add', { agentId: this._agent.id });
      if (!r.canceled) this._docs = r.documents || this._docs;
      const failed = (r.results || []).filter((x) => !x.success);
      if (failed.length) this._errBox.textContent = failed.map((f) => (f.path || 'file') + ': ' + (f.error || 'failed')).join('; ');
      this._changed();
    } catch (e) {
      this._errBox.textContent = 'Add documents failed: ' + e.message;
    }
  }

  async remove(docId) {
    this._errBox.textContent = '';
    try {
      const r = await this._inv('kb.remove', { agentId: this._agent.id, docId });
      this._docs = r.documents || [];
      this._changed();
    } catch (e) {
      this._errBox.textContent = 'Remove failed: ' + e.message;
    }
  }

  _changed() {
    this._onDocsChanged(this._docs);
    this.render();
  }

  _listHtml() {
    if (!this._docs.length) {
      return '<div class="luma-empty">No documents yet. Add PDFs or text files to give this agent reference knowledge.</div>';
    }
    return this._docs.map((d) => AgentKnowledgeSection._docHtml(d)).join('');
  }

  static _docHtml(d) {
    const esc = HtmlEscaper.escape;
    return '<div class="am-kb-doc">'
      + '<span class="am-kb-name" title="' + esc(d.filename || '') + '">' + esc(d.filename || ('Document ' + d.id)) + '</span>'
      + '<span class="am-kb-meta">' + AgentCard.plural(d.pages || 1, 'page') + ' · ' + AgentCard.plural(d.chunks || 0, 'chunk') + '</span>'
      + '<button type="button" class="luma-btn danger" data-kb-remove="' + esc(d.id) + '">Remove</button>'
      + '</div>';
  }
}
