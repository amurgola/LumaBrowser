import Dialogs from '../../../core/llm-server/ui/js/dialogs/Dialogs.js';
import HtmlEscaper from '../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import McpServerCard from './McpServerCard.js';
import McpServerForm from './McpServerForm.js';

export default class McpServersTab {
  static CSS_ID = 'mcpc-css';
  static CSS_HREF = '/llm-ui/ext/mcp-connector/setup-ui.css';

  static HEAD_HTML = '<div><h2 class="luma-title">MCP Servers</h2>'
    + '<p class="luma-sub">Connect outside <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener">MCP</a> '
    + 'servers. Their tools are discovered live and added to LumaBrowser’s own MCP surface and the chat agent’s '
    + 'tool catalog. Enable each tool for chat under the Tools menu; toggle it for external clients in Settings → MCP.</p></div>';

  static EMPTY_HTML = '<div class="luma-empty">No servers yet. Click “Add a server” to connect one '
    + '(e.g. a stdio command like <code>npx -y @modelcontextprotocol/server-filesystem /path</code>, '
    + 'or an HTTP endpoint URL).</div>';

  constructor(el, api) {
    this._el = el;
    this._api = api;
    this._servers = [];
    this._editing = null;
    this._formOpen = false;
    this._formTransport = 'stdio';
  }

  mount() {
    McpServersTab._injectCss();
    this._el.classList.add('luma-setup');
    return this.refresh();
  }

  async refresh() {
    try {
      const r = await this._inv('list');
      this._servers = (r && r.servers) || [];
    } catch (e) {
      this._el.innerHTML = '<div class="luma-error">Failed to load servers: ' + HtmlEscaper.escape(e.message) + '</div>';
      return;
    }
    this._render();
  }

  openForm(server) {
    this._editing = server || null;
    this._formTransport = (server && server.transport) || 'stdio';
    this._formOpen = true;
    this._render();
  }

  closeForm() {
    this._editing = null;
    this._formOpen = false;
    this._render();
  }

  async toggleServer(id, enabled) {
    await this._act(() => this._inv('toggle', { id, enabled }), 'Failed: ');
  }

  async reconnect(id) {
    await this._act(() => this._inv('reconnect', { id }), 'Reconnect failed: ');
  }

  async deleteServer(id, name) {
    if (!(await Dialogs.confirm('Remove server "' + name + '"? Its tools will disappear from chat.'))) return;
    await this._act(() => this._inv('delete', { id }), 'Delete failed: ');
  }

  async saveForm(form) {
    const errBox = form.querySelector('.luma-form-err');
    errBox.textContent = '';
    const { patch, error } = McpServerForm.collect(form);
    if (error) { errBox.textContent = error; return; }
    const saveBtn = form.querySelector('[data-save]');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Connecting…';
    try {
      if (this._isEdit()) await this._inv('update', { id: this._editing.id, patch });
      else await this._inv('create', patch);
      this.closeForm();
      await this.refresh();
    } catch (e) {
      errBox.textContent = e.message;
      saveBtn.disabled = false;
      saveBtn.textContent = McpServerForm.saveLabel(this._editing);
    }
  }

  _isEdit() {
    return !!(this._editing && this._editing.id);
  }

  async _act(fn, failurePrefix) {
    try {
      await fn();
      await this.refresh();
    } catch (e) {
      await Dialogs.alert(failurePrefix + e.message);
    }
  }

  async _inv(action, payload) {
    const r = await this._api.invoke(action, payload);
    if (!r || !r.success) throw new Error((r && r.error) || (action + ' failed'));
    return r.result;
  }

  _render() {
    this._el.innerHTML = '';
    this._el.appendChild(this._head());
    if (this._formOpen) this._el.appendChild(this._form());
    this._el.appendChild(this._list());
  }

  _head() {
    const head = document.createElement('div');
    head.className = 'luma-head';
    head.innerHTML = McpServersTab.HEAD_HTML;
    const addBtn = document.createElement('button');
    addBtn.className = 'luma-btn primary';
    addBtn.textContent = 'Add a server';
    addBtn.addEventListener('click', () => this.openForm(null));
    head.appendChild(addBtn);
    return head;
  }

  _form() {
    return McpServerForm.render(this._editing, this._formTransport, {
      transportChanged: ({ name, enabled, transport }) => {
        this._formTransport = transport;
        this._editing = { ...(this._editing || {}), name, enabled, transport };
        this._render();
      },
      cancel: () => this.closeForm(),
      submit: (form) => this.saveForm(form),
    });
  }

  _list() {
    const list = document.createElement('div');
    list.className = 'luma-list';
    if (!this._servers.length && !this._formOpen) list.innerHTML = McpServersTab.EMPTY_HTML;
    const on = {
      toggle: (id, enabled) => this.toggleServer(id, enabled),
      reconnect: (id) => this.reconnect(id),
      edit: (server) => this.openForm(server),
      remove: (id, name) => this.deleteServer(id, name),
    };
    for (const s of this._servers) list.appendChild(McpServerCard.render(s, on));
    return list;
  }

  static _injectCss() {
    if (document.getElementById(McpServersTab.CSS_ID)) return;
    const link = document.createElement('link');
    link.id = McpServersTab.CSS_ID;
    link.rel = 'stylesheet';
    link.href = McpServersTab.CSS_HREF;
    document.head.appendChild(link);
  }
}
