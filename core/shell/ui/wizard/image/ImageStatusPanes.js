import HtmlEscaper from '../../../../llm-server/ui/js/format/HtmlEscaper.js';
import ProgressPane from '../ProgressPane.js';
import WizardApis from '../WizardApis.js';

export default class ImageStatusPanes {
  constructor(wizard, step) {
    this._w = wizard;
    this._step = step;
  }

  progress(pane) {
    ProgressPane.render(pane, 'img', () => {
      this._w.state.image.canceled = true;
      WizardApis.cancelDownload('imageServer');
    });
  }

  done(pane) {
    const I = this._w.state.image;
    const rec = I.rec || {};
    const name = (I.found && I.found.name) || (rec.model && (rec.model.label || rec.model.id)) || 'Image model';
    pane.innerHTML = `
        <div class="setup-wizard__rec">
          <div class="setup-wizard__rec-head">Image generation ready</div>
          <div class="setup-wizard__rec-name">${HtmlEscaper.escape(name)}</div>
          <p class="setup-wizard__rec-why">
            ${I.found ? 'Linked and running, no download needed.' : 'Downloaded and running.'} Image generation is available via the LLM tab's
            Image section and any feature that calls into it.
            Click <strong>Continue</strong> to finish setup.
          </p>
        </div>
      `;
  }

  error(pane) {
    pane.innerHTML = `
        <div class="setup-wizard__status setup-wizard__status--err" style="margin-bottom:14px;">${HtmlEscaper.escape(this._w.state.image.error || 'Image setup failed.')}</div>
        <div style="display:flex; gap:10px;">
          <button class="setup-wizard__btn setup-wizard__btn--primary" id="imgRetry" type="button">Try again</button>
          <button class="setup-wizard__btn setup-wizard__btn--secondary" id="imgSkipFromErr" type="button">Skip this step</button>
        </div>
      `;
    pane.querySelector('#imgRetry').addEventListener('click', () => {
      const I = this._w.state.image;
      Object.assign(I, { view: I.rec ? 'recommend' : 'ask', error: null, canceled: false });
      this._repaint();
    });
    pane.querySelector('#imgSkipFromErr').addEventListener('click', () => {
      Object.assign(this._w.state.image, { skipped: true, resolved: true, view: 'ask', error: null });
      this._repaint();
    });
  }

  _repaint() {
    this._step.render();
    this._w.renderFooter();
  }
}
