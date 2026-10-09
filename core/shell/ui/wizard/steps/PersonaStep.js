import HtmlEscaper from '../../../../llm-server/ui/js/format/HtmlEscaper.js';
import WizardPersonas from '../WizardPersonas.js';
import WizardStepView from './WizardStepView.js';

export default class PersonaStep extends WizardStepView {
  render() {
    this._body.innerHTML = `
        <div class="setup-wizard__panel">
          <div class="setup-wizard__step-eyebrow">Get started</div>
          <h2 class="setup-wizard__step-title">What do you want to do?</h2>
          <p class="setup-wizard__step-desc">
            Pick the one closest to you. It only decides how much we ask; everything
            can be changed later in Settings.
          </p>
          <div class="setup-wizard__card-grid">${this._cardsHtml()}</div>
        </div>
      `;
    this._body.querySelectorAll('[data-persona]').forEach((el) => {
      el.addEventListener('click', () => {
        this._w.applyPersona(el.getAttribute('data-persona'));
        this._w.render();
        this._w.goNext();
      });
    });
  }

  _cardsHtml() {
    const esc = HtmlEscaper.escape;
    const picked = this._state.persona;
    return WizardPersonas.PERSONAS.map((p) => `
            <button class="setup-wizard__card${picked === p.id ? ' setup-wizard__card--selected' : ''}"
                    type="button" data-persona="${p.id}">
              <div class="setup-wizard__card-title">${esc(p.title)}</div>
              <div class="setup-wizard__card-desc">${esc(p.desc)}</div>
            </button>`).join('');
  }
}
