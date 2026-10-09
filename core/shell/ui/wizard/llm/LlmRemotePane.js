import HtmlEscaper from '../../../../llm-server/ui/js/format/HtmlEscaper.js';

export default class LlmRemotePane {
  constructor(wizard, step) {
    this._w = wizard;
    this._step = step;
  }

  render(pane) {
    const esc = HtmlEscaper.escape;
    const llm = this._w.state.llm;
    pane.innerHTML = `
        <div class="setup-wizard__field">
          <label class="setup-wizard__label" for="setupLlmEndpoint">Endpoint</label>
          <input id="setupLlmEndpoint" type="url" class="setup-wizard__input" value="${esc(llm.endpoint)}">
          <div class="setup-wizard__help">Anthropic: <code>https://api.anthropic.com</code> · LM Studio: <code>http://localhost:1234</code> · Ollama: <code>http://localhost:11434</code></div>
        </div>
        <div class="setup-wizard__field">
          <label class="setup-wizard__label" for="setupLlmKey">API key</label>
          <input id="setupLlmKey" type="password" class="setup-wizard__input"
            value="${esc(llm.apiKey)}" autocomplete="off" spellcheck="false"
            placeholder="sk-ant-... / sk-..." style="font-family: var(--font-mono); font-size: 12px;">
          <div class="setup-wizard__help">Stored locally in your user database. For a local server with no auth, enter any placeholder string.</div>
        </div>
        <div class="setup-wizard__field">
          <div style="display:flex; gap:10px; align-items:flex-end;">
            <div style="flex:1;">
              <label class="setup-wizard__label" for="setupLlmModel">Default model</label>
              <select id="setupLlmModel" class="setup-wizard__select">${LlmRemotePane._optionsHtml(llm)}</select>
            </div>
            <button class="setup-wizard__btn setup-wizard__btn--secondary" id="setupLlmFetch" type="button">Fetch models</button>
          </div>
          <div class="setup-wizard__status" id="setupLlmStatus"></div>
        </div>
      `;
    this._wireInputs(pane);
    pane.querySelector('#setupLlmFetch').addEventListener('click', () => this._fetchModels(pane));
  }

  static _optionsHtml(llm) {
    const esc = HtmlEscaper.escape;
    if (llm.models.length === 0) return '<option value="">Fetch models to populate…</option>';
    return llm.models.map((m) => {
      const id = m && m.id ? m.id : String(m);
      return `<option value="${esc(id)}" ${id === llm.selectedModel ? 'selected' : ''}>${esc(id)}</option>`;
    }).join('');
  }

  _wireInputs(pane) {
    const llm = this._w.state.llm;
    const endpointEl = pane.querySelector('#setupLlmEndpoint');
    const keyEl = pane.querySelector('#setupLlmKey');
    const modelEl = pane.querySelector('#setupLlmModel');
    endpointEl.addEventListener('input', () => { llm.endpoint = endpointEl.value.trim(); this._w.renderFooter(); });
    keyEl.addEventListener('input', () => { llm.apiKey = keyEl.value; this._w.renderFooter(); });
    modelEl.addEventListener('change', () => { llm.selectedModel = modelEl.value; this._w.renderFooter(); });
  }

  async _fetchModels(pane) {
    const llm = this._w.state.llm;
    const fetchBtn = pane.querySelector('#setupLlmFetch');
    const statusEl = pane.querySelector('#setupLlmStatus');
    const status = (variant, text) => { statusEl.className = `setup-wizard__status setup-wizard__status--${variant}`; statusEl.textContent = text; };
    if (!llm.endpoint) { status('err', 'Enter an endpoint first.'); return; }
    fetchBtn.disabled = true;
    fetchBtn.textContent = 'Fetching…';
    status('info', 'Contacting provider…');
    try {
      const result = await window.ipcBridge.fetchModelsForEndpoint(llm.type, llm.endpoint, llm.apiKey || null);
      if (result && result.success && Array.isArray(result.models) && result.models.length > 0) this._loaded(result.models, status);
      else status('err', (result && result.error) || 'No models returned. Check endpoint and key.');
    } catch (err) {
      status('err', err.message || 'Fetch failed.');
    } finally {
      fetchBtn.disabled = false;
      fetchBtn.textContent = 'Fetch models';
    }
  }

  _loaded(models, status) {
    const llm = this._w.state.llm;
    llm.models = models;
    llm.selectedModel = (models[0] && models[0].id) || '';
    status('ok', `Loaded ${models.length} model${models.length === 1 ? '' : 's'}.`);
    this._step.render();
    this._w.renderFooter();
  }
}
