import HtmlEscaper from '../../../../llm-server/ui/js/format/HtmlEscaper.js';
import WizardPersonas from '../WizardPersonas.js';
import WorkflowPresets from '../WorkflowPresets.js';
import WizardStepView from './WizardStepView.js';

export default class DoneStep extends WizardStepView {
  render() {
    const enabledIds = this._w.enabledExtensions();
    this._body.innerHTML = `
        <div class="setup-wizard__panel">
          <div class="setup-wizard__step-eyebrow">Review</div>
          <h2 class="setup-wizard__step-title">Ready to launch</h2>
          <p class="setup-wizard__step-desc">
            Here's what you picked. Click <strong>Finish Setup</strong> to apply and open LumaBrowser.
          </p>

          <div class="setup-wizard__summary">
            ${this._summaryRowsHtml(enabledIds)}
          </div>

          <label class="setup-wizard__summary-row" for="setupAutoUpdate"
                 style="display:flex;align-items:center;gap:10px;cursor:pointer;">
            <input type="checkbox" id="setupAutoUpdate" checked>
            <span>
              <span class="setup-wizard__summary-label">Check for updates automatically</span>
              <span class="setup-wizard__summary-value" style="display:block;opacity:0.7;font-size:0.85em;">
                When off, LumaBrowser never contacts the update server. You can still check manually from Settings → About.
              </span>
            </span>
          </label>

          <div class="setup-wizard__callout">
            All of this can be changed later under <strong>Settings</strong>, and you can re-run
            this wizard from <strong>Settings > About</strong>.
          </div>
          <div class="setup-wizard__status" id="setupDoneStatus"></div>
        </div>
      `;
    this._fillApiLine();
    this._reflectAutoUpdate();
  }

  _summaryRowsHtml(enabledIds) {
    const s = this._state;
    const plain = this._w.isPlainCopy();
    const rows = [[plain ? 'Path' : 'Workflow', this._pathLabel(plain)]];
    if (!plain) rows.push(['Features', this._featureNames(enabledIds)]);
    if (WorkflowPresets.needsLlm(enabledIds)) rows.push([plain ? 'Chat model' : 'LLM', DoneStep._llmLabel(s.llm, plain)]);
    const images = this._imagesLabel(plain);
    if (images !== null) rows.push(['Images', images]);
    let html = rows.map(([label, value]) => DoneStep._row(label, HtmlEscaper.escape(value))).join('');
    if (s.persona === 'build') html += DoneStep._row('Agent API', 'Loading…', 'setupApiLine');
    if (enabledIds.includes('notification-interceptor')) html += DoneStep._row('Webhook', HtmlEscaper.escape(s.webhookUrl || 'Not set (capture-and-log only)'));
    return html;
  }

  static _row(label, valueHtml, valueId) {
    return `
            <div class="setup-wizard__summary-row">
              <span class="setup-wizard__summary-label">${label}</span>
              <span class="setup-wizard__summary-value"${valueId ? ` id="${valueId}"` : ''}>${valueHtml}</span>
            </div>`;
  }

  _pathLabel(plain) {
    if (plain) {
      const persona = WizardPersonas.find(this._state.persona);
      return persona ? persona.title : 'Chat';
    }
    const preset = WorkflowPresets.find(this._state.workflow);
    return preset ? preset.title : 'Not set';
  }

  _featureNames(enabledIds) {
    const names = enabledIds.map((id) => (this._w.extensions.find((e) => e.id === id) || {}).name || id);
    return names.length ? names.join(', ') : 'None';
  }

  static _llmLabel(llm, plain) {
    if (llm.mode !== 'local') return `${llm.type} · ${llm.selectedModel || 'not set'}`;
    if (plain) return llm.local.done ? 'Ready' : 'Not set up';
    return `Local · ${llm.local.modelName || 'not set'}`;
  }

  _imagesLabel(plain) {
    const I = this._state.image;
    const A = this._state.auto;
    if (!I || !I.resolved) return null;
    if (I.done) return plain ? 'Ready' : ((I.rec && I.rec.model && (I.rec.model.label || I.rec.model.id)) || 'Local image generation');
    if (this._state.flow === 'auto' && A.plan && A.plan.image && A.imageError) return `Failed (${A.imageError}), retry from the Image tab`;
    return 'Not installed, add later from the Image tab';
  }

  _fillApiLine() {
    const apiLine = this._body.querySelector('#setupApiLine');
    const api = window.electronAPI;
    if (!apiLine || !api) return;
    Promise.all([
      api.getApiPort ? api.getApiPort().catch(() => null) : null,
      api.getMcpEnabled ? api.getMcpEnabled().catch(() => null) : null,
    ]).then(([port, mcp]) => {
      const bits = [];
      if (port) bits.push(`REST on http://localhost:${port}`);
      bits.push(mcp === false ? 'MCP off' : 'MCP on');
      apiLine.textContent = bits.join(', ');
    }).catch(() => { apiLine.textContent = 'See Settings > API'; });
  }

  _reflectAutoUpdate() {
    const api = window.electronAPI;
    if (!api || !api.getAutoCheckUpdates) return;
    api.getAutoCheckUpdates().then((v) => {
      const cb = this._body.querySelector('#setupAutoUpdate');
      if (cb) cb.checked = v !== false;
    }).catch(() => {});
  }
}
