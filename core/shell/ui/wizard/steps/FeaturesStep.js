import HtmlEscaper from '../../../../llm-server/ui/js/format/HtmlEscaper.js';
import WizardStepView from './WizardStepView.js';

export default class FeaturesStep extends WizardStepView {
  render() {
    if (this._w.extensions.length === 0) {
      this._renderLoading();
      return;
    }
    this._body.innerHTML = `
        <div class="setup-wizard__panel">
          <h2 class="setup-wizard__step-title">Pick your features</h2>
          <p class="setup-wizard__step-desc">
            Turn on what you'll use. Each one can be toggled again later under Settings → Extensions.
          </p>
          <div class="setup-wizard__ext-list">${this._rowsHtml() || '<div class="setup-wizard__callout">No extensions discovered.</div>'}</div>
        </div>
      `;
    this._rerenderWhenAddonsLoad();
    this._body.querySelectorAll('input[data-ext-id]').forEach((cb) => {
      cb.addEventListener('change', () => {
        this._state.extensionOverrides.set(cb.dataset.extId, cb.checked);
        this._w.rebuildSteps();
        this._w.renderFooter();
      });
    });
  }

  _renderLoading() {
    this._body.innerHTML = `
          <div class="setup-wizard__panel">
            <h2 class="setup-wizard__step-title">Loading feature list…</h2>
            <p class="setup-wizard__step-desc">Discovering installed extensions.</p>
          </div>
        `;
    this._w.extensionsReady.then(() => {
      if (this._isCurrent('features')) this.render();
    });
  }

  _rerenderWhenAddonsLoad() {
    if (this._addonsWatched) return;
    this._addonsWatched = true;
    this._w.addonsReady.then(() => {
      if (this._isCurrent('features')) this.render();
    });
  }

  _rowsHtml() {
    const installed = this._w.extensions.filter((ext) => !ext.debugOnly).map((ext) => ({ ext, meta: FeaturesStep._installedMeta(ext) }));
    const addons = this._w.addons.entries().map((ext) => ({ ext, meta: 'Downloads when you finish' }));
    return [...installed, ...addons]
      .sort((a, b) => a.ext.name.localeCompare(b.ext.name))
      .map(({ ext, meta }) => this._rowHtml(ext, meta)).join('');
  }

  static _installedMeta(ext) {
    const missing = (ext.dependencies || []).filter((d) => d.isRequired && !d.installed).map((d) => d.name).join(', ');
    return missing ? `Missing: ${missing}` : 'Dependencies OK';
  }

  _rowHtml(ext, meta) {
    const esc = HtmlEscaper.escape;
    const on = this._state.extensionOverrides.get(ext.id) === true;
    return `
          <div class="setup-wizard__ext-row">
            <div class="setup-wizard__ext-row-info">
              <div class="setup-wizard__ext-row-name">${esc(ext.name)}</div>
              <div class="setup-wizard__ext-row-desc">${esc(ext.description || 'No description')}</div>
              <div class="setup-wizard__ext-row-meta">${esc(meta)} · v${esc(ext.version)}</div>
            </div>
            <label class="setup-wizard__toggle">
              <input type="checkbox" data-ext-id="${esc(ext.id)}" ${on ? 'checked' : ''}>
              <span class="setup-wizard__toggle-slider"></span>
            </label>
          </div>
        `;
  }
}
