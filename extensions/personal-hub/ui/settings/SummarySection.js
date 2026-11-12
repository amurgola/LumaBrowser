import WidgetDom from '../widgets/WidgetDom.js';
import HubSection from './HubSection.js';

export default class SummarySection extends HubSection {
  static DEFAULT_OPTION = '<option value="">Use the active provider (default)</option>';

  html() {
    return `
    <h4 class="luma-section-label">Summaries</h4>
    <div class="luma-field-help">The Hub can distil your activity into one card per context: what is going on, and whether anyone is waiting on you. A model writes each card and only rewrites it when that context's items change. It only proposes: it never creates tasks or dismisses anything. Without it the cards still show, filled in by plain rules.</div>
    <div class="ext-form-row-inline ext-mt-8">
      <label class="luma-check"><input type="checkbox" id="ext-hub-sumEnabled"> Write summaries with a model</label>
    </div>
    <div class="ext-form-row-inline ext-mt-8">
      <label class="luma-field-label" for="ext-hub-sumModel" style="margin:0">Model</label>
      <select class="luma-field-input" id="ext-hub-sumModel" aria-label="Model that writes the summaries">${SummarySection.DEFAULT_OPTION}</select>
      <button class="luma-btn luma-btn--sm" id="ext-hub-sumRunBtn" title="Write every card again now">Summarise now</button>
    </div>
    <div class="luma-field-help" id="ext-hub-sumStatus"></div>
    <div class="luma-field-help">A small local model is enough and keeps everything on this computer; it needs to be loaded while you work.</div>`;
  }

  bind(container) {
    super.bind(container);
    this.$('sumEnabled').addEventListener('change', () => this._setEnabled());
    this.$('sumModel').addEventListener('change', () => this._saveModel());
    this.$('sumRunBtn').addEventListener('click', () => this._runNow());
  }

  async load() {
    if (!this._root) return;
    const [{ status }] = await Promise.all([this.call('summaryStatus'), this._loadModels()]);
    this._renderStatus(status || {});
  }

  async _loadModels() {
    const select = this.$('sumModel');
    if (!select) return;
    const { models = [], chosen = '' } = await this.call('listSummaryModels').catch(() => ({}));
    const esc = WidgetDom.esc;
    select.innerHTML = SummarySection.DEFAULT_OPTION + models.map((m) => `<option value="${esc(m.value)}">${esc(m.label)}</option>`).join('');
    select.value = chosen;
    if (select.value !== chosen) select.value = '';
  }

  _renderStatus(status) {
    const enabled = this.$('sumEnabled');
    if (enabled) enabled.checked = !!status.enabled;
    const run = this.$('sumRunBtn');
    if (run) run.disabled = !status.available || !!status.running;
    const line = this.$('sumStatus');
    if (line) line.textContent = SummarySection.statusText(status);
  }

  static statusText(status) {
    if (!status.available) return 'No language model service is available to the Hub.';
    const model = status.model ? `Using ${status.model}.` : 'No model is set up yet: pick one above, or set a provider in Settings.';
    if (status.running) return `${model} Writing summaries now.`;
    if (status.lastError) return `${model} Last attempt failed: ${status.lastError}`;
    if (!status.enabled) return `${model} Summaries are off: cards are filled in by rules.`;
    return status.lastRunAt ? `${model} Last written ${new Date(status.lastRunAt).toLocaleTimeString()}.` : `${model} Cards are written as activity arrives.`;
  }

  _setEnabled() {
    const enabled = this.$('sumEnabled').checked;
    return this.act(() => this.call('setSummariesEnabled', enabled), enabled ? 'Summaries are on.' : 'Summaries are off.');
  }

  _saveModel() {
    const value = this.$('sumModel').value;
    return this.act(() => this.call('setSummaryModel', value), 'Summary model saved.');
  }

  _runNow() {
    const button = this.$('sumRunBtn');
    button.disabled = true;
    this.$('sumStatus').textContent = 'Writing summaries now.';
    return this.act(async () => {
      const { result } = await this.call('summarizeNow', { force: true });
      if (result && result.failed) throw new Error(`${result.failed} card${result.failed === 1 ? '' : 's'} could not be written; see the status line.`);
    }, 'Summaries written.');
  }
}
