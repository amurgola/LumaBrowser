import ImageSetup from '../setup/ImageSetup.js';
import ProgressBar from './ProgressBar.js';

export default class ImageSetupFlow {
  constructor(wizard) {
    this._wizard = wizard;
  }

  async run() {
    const w = this._wizard;
    const image = w.state.image;
    const rec = image.rec;
    if (!rec || !rec.runtime || (!rec.model && !image.found)) {
      Object.assign(image, { error: 'No image runtime or model resolved for this host.', view: 'error' });
      w.render();
      return;
    }
    Object.assign(image, { busy: true, canceled: false, view: 'progress' });
    w.overlay.querySelector('.wz-back').disabled = true;
    w.setCloseDisabled(true);
    w.render();
    const result = await ImageSetup.run(w.imageApi(), {
      runtime: rec.runtime,
      model: rec.model,
      found: image.found,
      isCanceled: () => image.canceled,
      ...this._hooks(w.body()),
    });
    image.busy = false;
    w.setCloseDisabled(false);
    if (!result.ok) {
      image.error = result.canceled ? 'Image setup canceled. You can re-open this wizard to resume.' : (result.message || 'Image setup failed');
      image.view = 'error';
    } else {
      image.view = 'done';
    }
    w.render();
  }

  _hooks(body) {
    const q = (s) => body.querySelector(s);
    return {
      onPhase: (t) => { const e = q('[data-img-phase]'); if (e) e.textContent = t; },
      onBar: (fraction, sub) => {
        ProgressBar.set(q('[data-img-bar]'), q('[data-img-fill]'), fraction);
        if (sub != null) { const s = q('[data-img-sub]'); if (s) s.textContent = sub; }
      },
      onSub: (t) => { const s = q('[data-img-sub]'); if (s) s.textContent = t; },
    };
  }
}
