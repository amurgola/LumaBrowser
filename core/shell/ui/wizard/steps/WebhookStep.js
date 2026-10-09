import HtmlEscaper from '../../../../llm-server/ui/js/format/HtmlEscaper.js';
import WizardStepView from './WizardStepView.js';

export default class WebhookStep extends WizardStepView {
  constructor(wizard) {
    super(wizard);
    this._loaded = false;
  }

  enter() {
    if (!this._state.webhookUrl) {
      this._loadSaved().then(() => {
        if (this._isCurrent('webhook')) this.render();
      });
    }
    this.render();
  }

  render() {
    this._body.innerHTML = `
        <div class="setup-wizard__panel">
          <div class="setup-wizard__step-eyebrow">Notification Interceptor</div>
          <h2 class="setup-wizard__step-title">Where should notifications go?</h2>
          <p class="setup-wizard__step-desc">
            Every intercepted web notification gets POSTed to this URL as JSON.
            Leave empty to capture-and-log only (you can add a URL later).
          </p>
          <div class="setup-wizard__field">
            <label class="setup-wizard__label" for="setupWebhook">Webhook URL</label>
            <input id="setupWebhook" type="url" class="setup-wizard__input"
              value="${HtmlEscaper.escape(this._state.webhookUrl)}"
              placeholder="https://hooks.example.com/webhook/abc123"
              autocomplete="off" spellcheck="false">
            <div class="setup-wizard__help">Slack, Discord, Zapier, n8n, or any HTTP endpoint that accepts JSON POST.</div>
            <div class="setup-wizard__status" id="setupWebhookStatus"></div>
          </div>
          <div style="display:flex; gap:10px;">
            <button class="setup-wizard__btn setup-wizard__btn--secondary" id="setupWebhookTest" type="button">Send test notification</button>
          </div>
        </div>
      `;
    const input = this._body.querySelector('#setupWebhook');
    input.addEventListener('input', () => { this._state.webhookUrl = input.value.trim(); });
    this._body.querySelector('#setupWebhookTest').addEventListener('click', () => this._test());
  }

  async _loadSaved() {
    if (this._loaded || !this._w.enabledExtensions().includes('notification-interceptor')) return;
    this._loaded = true;
    if (!window.electronAPI || !window.electronAPI.getWebhookUrl) return;
    try {
      const url = await window.electronAPI.getWebhookUrl();
      if (typeof url === 'string') this._state.webhookUrl = url;
    } catch (_) {}
  }

  async _test() {
    const testBtn = this._body.querySelector('#setupWebhookTest');
    const statusEl = this._body.querySelector('#setupWebhookStatus');
    const status = (variant, text) => { statusEl.className = `setup-wizard__status setup-wizard__status--${variant}`; statusEl.textContent = text; };
    const url = this._state.webhookUrl;
    if (!url) { status('err', 'Enter a URL first.'); return; }
    testBtn.disabled = true;
    testBtn.textContent = 'Sending…';
    status('info', 'Sending a test payload…');
    try {
      const test = window.electronAPI.testWebhookDirect || window.electronAPI.testWebhook;
      const result = await test(url);
      if (result && result.success) status('ok', `Webhook responded ${result.status || 'OK'}.`);
      else status('err', (result && result.error) || 'Webhook did not respond successfully.');
    } catch (err) {
      status('err', err.message || 'Request failed.');
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = 'Send test notification';
    }
  }
}
