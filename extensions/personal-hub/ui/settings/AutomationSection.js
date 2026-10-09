import HtmlEscaper from '../../../../core/llm-server/ui/js/format/HtmlEscaper.js';
import Dialogs from '../../../../core/llm-server/ui/js/dialogs/Dialogs.js';
import SavedBadge from '../../../ui-kit/ui/SavedBadge.js';
import HubSection from './HubSection.js';

export default class AutomationSection extends HubSection {
  static QUEUE_EXAMPLE = `{
  "app": "gmail",
  "threadKey": "thread-18c2a",
  "title": "Invoice question from Dana",
  "summary": "Dana asks whether the March invoice included the add-on seats.",
  "priority": "high",
  "participants": ["Dana Reyes"],
  "url": "https://mail.google.com/mail/u/0/#inbox/18c2a",
  "labels": ["billing"],
  "body": "The latest message text (optional)"
}`;

  static ENRICH_EXAMPLE = `{
  "app": "slack",
  "threadKey": "C024BE91L:1712345678.000100",
  "summary": "Ops wants a decision on the rollout window by Friday.",
  "priority": "urgent",
  "labels": ["decision"],
  "context": { "deadline": "2026-10-10" },
  "taskId": "task_... (optional, links the thread to a board task)"
}`;

  constructor(tab, { onInfo = () => {} } = {}) {
    super(tab);
    this._onInfo = onInfo;
    this._info = null;
  }

  html() {
    const esc = HtmlEscaper.escape;
    return `
    <h4 class="luma-section-label">Automation access</h4>
    <div class="luma-field-help">An automation such as n8n can push items into the conversation queue and add context to threads it has already analysed. The Notifications tab's webhook keeps forwarding every intercepted notification to it; these endpoints are the way back.</div>
    <div class="luma-kv ext-mt-8">
      <div class="luma-kv-row"><span class="luma-kv-key">Base URL</span><span class="luma-kv-val"><code class="luma-code-inline" id="ext-hub-autoBase"></code></span></div>
      <div class="luma-kv-row"><span class="luma-kv-key">Queue</span><span class="luma-kv-val"><code class="luma-code-inline">POST</code> <code class="luma-code-inline" id="ext-hub-autoQueue"></code></span></div>
      <div class="luma-kv-row"><span class="luma-kv-key">Enrich</span><span class="luma-kv-val"><code class="luma-code-inline">POST</code> <code class="luma-code-inline" id="ext-hub-autoEnrich"></code></span></div>
      <div class="luma-kv-row"><span class="luma-kv-key">Token</span><span class="luma-kv-val">
        <input type="password" class="luma-field-input" id="ext-hub-autoToken" readonly style="max-width:260px">
        <button class="luma-btn luma-btn--sm" id="ext-hub-autoCopy">Copy</button>
        <button class="luma-btn luma-btn--sm" id="ext-hub-autoRotate">Rotate</button>
      </span></div>
    </div>
    <div class="luma-field-help ext-mt-8">Send <code class="luma-code-inline">Authorization: Bearer &lt;token&gt;</code> with each request.</div>
    <details class="ext-details ext-mt-8">
      <summary>Example: push a queue item</summary>
      <pre>${esc(AutomationSection.QUEUE_EXAMPLE)}</pre>
    </details>
    <details class="ext-details">
      <summary>Example: enrich a thread</summary>
      <pre>${esc(AutomationSection.ENRICH_EXAMPLE)}</pre>
      <div class="luma-field-help">Address the thread by <code class="luma-code-inline">id</code> or by <code class="luma-code-inline">app</code> plus <code class="luma-code-inline">threadKey</code>.</div>
    </details>`;
  }

  bind(container) {
    super.bind(container);
    this.$('autoCopy').addEventListener('click', () => this._copy());
    this.$('autoRotate').addEventListener('click', () => this._rotate());
  }

  async load() {
    if (!this._root) return;
    this._info = await this.call('getInboundInfo');
    this._render();
    this._onInfo(this._info);
  }

  _render() {
    const info = this._info || {};
    this.$('autoBase').textContent = info.baseUrl || '';
    this.$('autoQueue').textContent = info.queueUrl || '';
    this.$('autoEnrich').textContent = info.enrichUrl || '';
    this.$('autoToken').value = info.token || '';
  }

  async _copy() {
    const token = this.$('autoToken').value;
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      SavedBadge.flash(this.$('autoCopy'), 'Copied');
    } catch (_) {
      this._tab.notify('Could not copy to the clipboard.', false);
    }
  }

  async _rotate() {
    const ok = await Dialogs.confirm('Rotate the token? Every automation using the old one must be updated.');
    if (!ok) return;
    await this.act(async () => {
      const { token } = await this.call('rotateInboundToken');
      if (this._info) this._info.token = token;
    }, 'Token rotated.');
  }
}
