import ImageSetup from '../../../../llm-server/ui/js/setup/ImageSetup.js';
import ProgressPane from '../ProgressPane.js';
import WizardApis from '../WizardApis.js';

export default class ImageRunner {
  constructor(wizard, step) {
    this._w = wizard;
    this._step = step;
  }

  async run() {
    const I = this._w.state.image;
    const rec = I.rec;
    if (!rec || !rec.runtime || (!rec.model && !I.found)) {
      I.error = 'No image runtime or model resolved for this host.';
      I.view = 'error';
      this._step.render();
      return;
    }
    Object.assign(I, { busy: true, canceled: false, view: 'progress' });
    this._repaint();
    const r = await ImageSetup.run(WizardApis.image(), {
      runtime: rec.runtime,
      model: rec.model,
      found: I.found,
      isCanceled: () => I.canceled,
      ...ProgressPane.hooks(this._step.pane(), 'img'),
    });
    if (r.ok) Object.assign(I, { busy: false, done: true, skipped: false, resolved: true, view: 'done' });
    else Object.assign(I, { busy: false, error: ImageRunner._failure(r), view: 'error' });
    this._repaint();
  }

  static _failure(r) {
    return r.canceled ? 'Image setup canceled. You can re-run this step from the Image tab later.' : (r.message || 'Image setup failed');
  }

  _repaint() {
    this._step.render();
    this._w.renderFooter();
  }
}
