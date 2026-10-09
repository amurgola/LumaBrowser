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
          <div class="setup-wizard__step-eyebrow">Custom</div>
          <h2 class="setup-wizard__step-title">Pick your features</h2>
          <p class="setup-wizard__step-desc">
            Turn on what you'll use. Each one can be toggled again later under Settings → Extensions.
          </p>
          <div class="setup-wizard__ext-list">${this._rowsHtml() || '<div class="setup-wizard__callout">No extensions discovered.</div>'}</div>
        </div>
      `;
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
            <div class="setup-wizard__step-eyebrow">Custom</div>
            <h2 class="setup-wizard__step-title">Loading feature list…</h2>
            <p class="setup-wizard__step-desc">Discovering installed extensions.</p>
          </div>
        `;
    this._w.extensionsReady.then(() => {
      if (this._isCurrent('features')) this.render();
    });
  }

  _rowsHtml() {
    const esc = HtmlEscaper.escape;
    return this._w.extensions
      .filter((ext) => !ext.debugOnly)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((ext) => {
        const on = this._state.extensionOverrides.get(ext.id) === true;
        const missing = (ext.dependencies || []).filter((d) => d.isRequired && !d.installed).map((d) => d.name).join(', ');
        const meta = missing ? `Missing: ${missing}` : 'Dependencies OK';
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
      }).join('');
  }
}
