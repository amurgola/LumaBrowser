import ImageAskPane from '../image/ImageAskPane.js';
import ImageRecommendPane from '../image/ImageRecommendPane.js';
import ImageRunner from '../image/ImageRunner.js';
import ImageStatusPanes from '../image/ImageStatusPanes.js';
import WizardStepView from './WizardStepView.js';

export default class ImageStep extends WizardStepView {
  constructor(wizard) {
    super(wizard);
    this.runner = new ImageRunner(wizard, this);
    this._ask = new ImageAskPane(wizard, this);
    this._recommend = new ImageRecommendPane(wizard, this);
    this._status = new ImageStatusPanes(wizard, this);
  }

  render() {
    this._body.innerHTML = `
        <div class="setup-wizard__panel">
          <div class="setup-wizard__step-eyebrow">Local AI · Optional</div>
          <h2 class="setup-wizard__step-title">Add local image generation?</h2>
          <p class="setup-wizard__step-desc">
            Generate images locally with <strong>stable-diffusion.cpp</strong>. Like the
            local LLM, this runs entirely on this machine: no cloud, no API keys.
            You can skip this and enable it later from the LLM tab's Image section.
          </p>
          <div id="setupImagePane"></div>
        </div>
      `;
    this._renderPane(this._state.image.view, this.pane());
  }

  pane() {
    return this._body.querySelector('#setupImagePane');
  }

  _renderPane(view, pane) {
    if (view === 'recommend') this._recommend.render(pane);
    else if (view === 'progress') this._status.progress(pane);
    else if (view === 'done') this._status.done(pane);
    else if (view === 'error') this._status.error(pane);
    else this._ask.render(pane);
  }
}
