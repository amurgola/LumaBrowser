import Dom from '../../../core/llm-server/ui/js/dom/Dom.js';
import StatusText from './StatusText.js';

export default class RunForm {
  static RESULT_CAP = 20000;

  constructor({ site, endpoint, invoke, onRan }) {
    this._site = site;
    this._endpoint = endpoint;
    this._invoke = invoke;
    this._onRan = onRan || (() => {});
    this._inputs = new Map();
    this._el = null;
    this._resultEl = null;
    this._runBtn = null;
  }

  render() {
    const form = Dom.el('form', 'sapi-form');
    form.addEventListener('submit', (e) => { e.preventDefault(); this.submit(); });
    const params = Array.isArray(this._endpoint.params) ? this._endpoint.params : [];
    if (!params.length) form.appendChild(Dom.el('div', 'luma-field-help ext-mt-0', 'This endpoint takes no parameters.'));
    for (const param of params) form.appendChild(this._row(param));
    const actions = Dom.el('div', 'sapi-actions');
    this._runBtn = Dom.el('button', 'luma-btn luma-btn--sm primary', 'Run');
    this._runBtn.type = 'submit';
    actions.appendChild(this._runBtn);
    form.appendChild(actions);
    this._resultEl = Dom.el('div', 'sapi-result ext-hidden');
    form.appendChild(this._resultEl);
    this._el = form;
    return form;
  }

  values() {
    const out = {};
    for (const [name, input] of this._inputs) {
      if (input.type === 'checkbox') { out[name] = !!input.checked; continue; }
      const raw = input.value;
      if (raw === '' || raw == null) continue;
      out[name] = input.dataset.type === 'number' && raw.trim() !== '' && Number.isFinite(Number(raw)) ? Number(raw) : raw;
    }
    return out;
  }

  async submit() {
    if (!this._el) return null;
    this._busy(true);
    let result;
    try {
      result = await this._invoke('run', this._site.id, this._endpoint.name, this.values());
    } catch (err) {
      result = { success: false, error: err && err.message ? err.message : String(err) };
    }
    this._busy(false);
    this.showResult(result);
    this._onRan(result);
    return result;
  }

  showResult(result) {
    const el = this._resultEl;
    if (!el) return;
    el.classList.remove('ext-hidden');
    el.textContent = '';
    if (result && result.success) {
      el.className = 'sapi-result luma-code';
      const code = Dom.el('code');
      code.textContent = RunForm.json(result.data);
      el.appendChild(code);
      return;
    }
    el.className = 'sapi-result luma-error';
    el.textContent = result && result.fault ? StatusText.fault(result.fault, result.advice) : ((result && result.error) || 'The run failed.');
  }

  static json(data) {
    let text;
    try { text = JSON.stringify(data === undefined ? null : data, null, 2); } catch (_) { text = String(data); }
    return text.length > RunForm.RESULT_CAP ? `${text.slice(0, RunForm.RESULT_CAP)}\n... (truncated)` : text;
  }

  _row(param) {
    const row = Dom.el('div', 'sapi-form-row');
    const label = Dom.el('label');
    label.textContent = `${param.name}${param.required ? ' *' : ''}`;
    label.title = param.description || '';
    const input = RunForm._input(param);
    const id = `ext-sapi-param-${this._endpoint.id}-${param.name}`;
    input.id = id;
    label.htmlFor = id;
    row.appendChild(label);
    row.appendChild(input);
    this._inputs.set(param.name, input);
    return row;
  }

  static _input(param) {
    const input = document.createElement('input');
    input.name = param.name;
    input.dataset.type = param.type || 'string';
    if (param.type === 'boolean') {
      input.type = 'checkbox';
      input.checked = param.default === true;
      return input;
    }
    input.className = 'luma-field-input';
    input.type = param.type === 'number' ? 'number' : 'text';
    if (param.type === 'number') input.step = 'any';
    if (param.default !== undefined) input.value = String(param.default);
    input.placeholder = param.example !== undefined ? String(param.example) : (param.description || '');
    return input;
  }

  _busy(on) {
    if (!this._runBtn) return;
    this._runBtn.disabled = on;
    this._runBtn.textContent = on ? 'Running' : 'Run';
  }
}
