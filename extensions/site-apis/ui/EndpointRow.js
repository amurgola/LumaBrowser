import Dom from '../../../core/llm-server/ui/js/dom/Dom.js';
import Dialogs from '../../../core/llm-server/ui/js/dialogs/Dialogs.js';
import Clipboard from '../../../core/llm-server/ui/js/dom/Clipboard.js';
import StatusText from './StatusText.js';
import RunForm from './RunForm.js';
import RunList from './RunList.js';

export default class EndpointRow {
  static COPY_RESET_MS = 1500;

  constructor({ site, endpoint, invoke, reload, runList }) {
    this._site = site;
    this._endpoint = endpoint;
    this._invoke = invoke;
    this._reload = reload;
    this._runList = runList || new RunList(invoke);
    this._detail = null;
    this._open = null;
  }

  get endpoint() { return this._endpoint; }

  render() {
    const e = this._endpoint;
    const row = Dom.el('div', 'sapi-endpoint');
    row.dataset.endpointId = e.id;
    row.appendChild(this._head());
    if (e.description) row.appendChild(Dom.el('div', 'sapi-meta', null)).textContent = e.description;
    const meta = Dom.el('div', 'sapi-meta');
    meta.textContent = `Params: ${StatusText.params(e.params)}. Last run: ${StatusText.lastRun(e.lastRun)}.`;
    row.appendChild(meta);
    row.appendChild(this._actions());
    this._detail = Dom.el('div', 'sapi-detail ext-hidden');
    row.appendChild(this._detail);
    return row;
  }

  toggle(which) {
    if (this._open === which) { this._close(); return; }
    this._open = which;
    this._detail.textContent = '';
    this._detail.classList.remove('ext-hidden');
    if (which === 'run') {
      const form = new RunForm({ site: this._site, endpoint: this._endpoint, invoke: this._invoke, onRan: () => this._reload() });
      this._detail.appendChild(form.render());
      return;
    }
    this._runList.load(this._endpoint.id, this._detail);
  }

  _close() {
    this._open = null;
    this._detail.textContent = '';
    this._detail.classList.add('ext-hidden');
  }

  _head() {
    const e = this._endpoint;
    const head = Dom.el('div', 'sapi-endpoint-head');
    head.appendChild(Dom.el('span', 'sapi-endpoint-name', null)).textContent = e.name;
    const pill = StatusText.endpointPill(e.status);
    head.appendChild(Dom.el('span', `luma-badge ${pill.cls}`, pill.label));
    if (e.usesLlm) {
      const llm = Dom.el('span', 'luma-badge warn', 'uses LLM');
      llm.title = 'A step rewrites the result with a model, so the output may vary between calls.';
      head.appendChild(llm);
    }
    if (e.toolName) head.appendChild(this._toolName(e.toolName));
    return head;
  }

  _toolName(name) {
    const btn = Dom.el('button', 'sapi-tool');
    btn.type = 'button';
    btn.textContent = name;
    btn.title = 'Copy the tool name';
    btn.addEventListener('click', async () => {
      const ok = await EndpointRow._copy(name);
      btn.textContent = ok ? 'Copied' : 'Copy failed';
      setTimeout(() => { btn.textContent = name; }, EndpointRow.COPY_RESET_MS);
    });
    return btn;
  }

  _actions() {
    const actions = Dom.el('div', 'sapi-actions');
    actions.appendChild(EndpointRow._button('Run', 'sapi-run-btn', () => this.toggle('run')));
    actions.appendChild(EndpointRow._button('Runs', 'sapi-runs-btn', () => this.toggle('runs')));
    actions.appendChild(EndpointRow._button('Delete', 'sapi-delete-endpoint-btn danger', () => this._delete()));
    return actions;
  }

  async _delete() {
    const ok = await Dialogs.confirm(`Delete endpoint "${this._endpoint.name}" and its run history?`, { okLabel: 'Delete', danger: true });
    if (!ok) return;
    try {
      const result = await this._invoke('deleteEndpoint', this._endpoint.id);
      if (result && result.success === false) await Dialogs.alert(`Could not delete the endpoint: ${result.error || 'unknown error'}`);
    } catch (err) {
      console.error('site-apis: delete endpoint failed:', err);
    }
    await this._reload();
  }

  static _button(label, cls, onClick) {
    const btn = Dom.el('button', `luma-btn luma-btn--sm ${cls}`, label);
    btn.type = 'button';
    btn.addEventListener('click', (e) => { e.preventDefault(); onClick(); });
    return btn;
  }

  static _copy(text) {
    if (window.electronAPI && window.electronAPI.copyToClipboard) return Promise.resolve(window.electronAPI.copyToClipboard(text)).then(() => true, () => false);
    return Clipboard.copyText(text);
  }
}
