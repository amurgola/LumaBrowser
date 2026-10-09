import AutoSetup from '../../../../llm-server/ui/js/setup/AutoSetup.js';
import ProgressPane from '../ProgressPane.js';
import WizardApis from '../WizardApis.js';

export default class AutoRunner {
  constructor(wizard, step) {
    this._w = wizard;
    this._step = step;
  }

  async run({ resumeFrom = null } = {}) {
    const A = this._w.state.auto;
    if (!A.plan) return;
    A.busy = true;
    A.canceled = false;
    A.view = 'progress';
    this._repaint();
    const r = await AutoSetup.run(WizardApis.all(), {
      plan: A.plan,
      isCanceled: () => A.canceled,
      resumeFrom,
      priorFile: A.modelFile || null,
      ...ProgressPane.hooks(this._step.pane(), 'auto'),
    });
    A.busy = false;
    if (!r.ok) this._failed(r);
    else this._succeeded(r);
    this._repaint();
  }

  _failed(r) {
    const A = this._w.state.auto;
    A.sysdeps = r.sysdeps || null;
    A.failedStep = r.failedStep || null;
    A.error = r.canceled ? 'Setup canceled. Your download progress is saved; try again to resume.' : (r.message || 'Automatic setup failed');
    A.view = 'error';
  }

  _succeeded(r) {
    const A = this._w.state.auto;
    A.sysdeps = null;
    A.modelFile = r.file || A.modelFile || '';
    A.modelName = (A.modelFile || '').replace(/\.[^.]+$/, '') || 'local-model';
    A.imageDone = !!(r.image && r.image.ok);
    A.imageError = r.image && !r.image.ok ? (r.image.message || null) : null;
    A.done = true;
    A.view = 'done';
    this._mirrorIntoGuidedState(A);
  }

  _mirrorIntoGuidedState(A) {
    const s = this._w.state;
    s.llm.mode = 'local';
    s.llm.local.done = true;
    s.llm.local.modelName = A.modelName;
    s.image.resolved = true;
    s.image.done = A.imageDone;
    s.image.skipped = !A.plan.image;
    if (A.imageDone && A.plan.image) s.image.rec = { model: { id: A.plan.image.modelId, label: A.plan.image.label } };
  }

  _repaint() {
    this._step.render();
    this._w.renderFooter();
  }
}
