import HtmlEscaper from '../../../../llm-server/ui/js/format/HtmlEscaper.js';
import WorkflowPresets from '../WorkflowPresets.js';
import WizardStepView from './WizardStepView.js';

export default class WorkflowStep extends WizardStepView {
  render() {
    this._body.innerHTML = `
        <div class="setup-wizard__panel">
          <div class="setup-wizard__step-eyebrow">Pick a starting point</div>
          <h2 class="setup-wizard__step-title">What do you want to use LumaBrowser for?</h2>
          <p class="setup-wizard__step-desc">
            Each preset toggles a specific set of built-in extensions. You can fine-tune the selection
            afterwards, and change any of this from <em>Settings → Extensions</em>.
          </p>
          <div class="setup-wizard__card-grid">${this._cardsHtml()}</div>
        </div>
      `;
    this._body.querySelectorAll('[data-preset]').forEach((el) => {
      el.addEventListener('click', () => {
        this._w.applyWorkflow(el.getAttribute('data-preset'));
        this._w.rebuildSteps();
        this._w.render();
      });
    });
  }

  _cardsHtml() {
    const esc = HtmlEscaper.escape;
    return WorkflowPresets.visible().map((preset) => {
      const selected = this._state.workflow === preset.id;
      const count = preset.custom ? 0 : preset.enabled.length;
      const extras = preset.custom ? '' : `<div class="setup-wizard__card-extras">${count} extension${count === 1 ? '' : 's'} enabled</div>`;
      return `
          <button class="setup-wizard__card${selected ? ' setup-wizard__card--selected' : ''}"
                  type="button" data-preset="${esc(preset.id)}">
            <div class="setup-wizard__card-title">
              ${esc(preset.title)}
              <span class="setup-wizard__card-badge">${esc(preset.badge)}</span>
            </div>
            <div class="setup-wizard__card-desc">${esc(preset.desc)}</div>
            ${extras}
          </button>
        `;
    }).join('');
  }
}
