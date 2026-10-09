import AutoPlanPane from '../auto/AutoPlanPane.js';
import AutoQuestionPanes from '../auto/AutoQuestionPanes.js';
import AutoRunner from '../auto/AutoRunner.js';
import AutoStatusPanes from '../auto/AutoStatusPanes.js';
import WizardStepView from './WizardStepView.js';

export default class AutoStep extends WizardStepView {
  static TITLES = {
    question: 'Do you also want image generation?',
    'question-music': 'Do you also want music generation?',
    plan: 'Your setup',
    progress: 'Setting everything up',
    done: 'All set',
  };

  static ERROR_TITLE = 'Something went wrong';

  constructor(wizard) {
    super(wizard);
    this.runner = new AutoRunner(wizard, this);
    this._questions = new AutoQuestionPanes(wizard, this);
    this._plan = new AutoPlanPane(wizard, this);
    this._status = new AutoStatusPanes(wizard, this);
  }

  render() {
    const view = this._state.auto.view;
    this._body.innerHTML = `
        <div class="setup-wizard__panel">
          <div class="setup-wizard__step-eyebrow">Automatic Local Setup</div>
          <h2 class="setup-wizard__step-title">${AutoStep.TITLES[view] || AutoStep.ERROR_TITLE}</h2>
          <div id="setupAutoPane"></div>
        </div>
      `;
    this._renderPane(view, this.pane());
  }

  pane() {
    return this._body.querySelector('#setupAutoPane');
  }

  _renderPane(view, pane) {
    if (view === 'question-music') this._questions.music(pane);
    else if (view === 'plan') this._plan.render(pane);
    else if (view === 'progress') this._status.progress(pane);
    else if (view === 'done') this._status.done(pane);
    else if (view === 'error') this._status.error(pane);
    else this._questions.image(pane);
  }
}
