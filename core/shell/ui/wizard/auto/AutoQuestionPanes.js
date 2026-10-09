import HardwareText from '../../../../llm-server/ui/js/setup/HardwareText.js';

export default class AutoQuestionPanes {
  static HARDWARE_CHANNEL = 'core.llmServer.getWizardHardware';

  constructor(wizard, step) {
    this._w = wizard;
    this._step = step;
  }

  image(pane) {
    const A = this._w.state.auto;
    pane.innerHTML = `
        <p class="setup-wizard__step-desc">
          Your chat model is picked automatically. Image generation is the only choice
          to make: it creates pictures locally, at the cost of one extra download.
        </p>
        <div class="setup-wizard__card-grid">
          <button class="setup-wizard__card${A.wantImage === true ? ' setup-wizard__card--selected' : ''}"
                  type="button" data-auto-img="yes">
            <div class="setup-wizard__card-title">Yes, add image generation</div>
            <div class="setup-wizard__card-desc">Chat and create images, all on this machine.</div>
          </button>
          <button class="setup-wizard__card${A.wantImage === false ? ' setup-wizard__card--selected' : ''}"
                  type="button" data-auto-img="no">
            <div class="setup-wizard__card-title">No, just chat</div>
            <div class="setup-wizard__card-desc">Smaller download. You can add images later from the LLM tab.</div>
          </button>
        </div>
        <div class="setup-wizard__rec-hw" id="setupAutoHwLine"></div>
      `;
    this._fillHardwareLine();
    pane.querySelectorAll('[data-auto-img]').forEach((el) => {
      el.addEventListener('click', () => {
        A.wantImage = el.getAttribute('data-auto-img') === 'yes';
        this._next(this._w.musicOffered() ? 'question-music' : 'plan');
      });
    });
  }

  music(pane) {
    const A = this._w.state.auto;
    pane.innerHTML = `
        <p class="setup-wizard__step-desc">
          Compose full songs with vocals from lyrics, right on this machine. Needs serious
          GPU memory and about a 54 GB download, and songs take a few minutes each to render.
        </p>
        <div class="setup-wizard__card-grid">
          <button class="setup-wizard__card${A.wantMusic === true ? ' setup-wizard__card--selected' : ''}"
                  type="button" data-auto-music="yes">
            <div class="setup-wizard__card-title">Yes, add music generation</div>
            <div class="setup-wizard__card-desc">Write lyrics in chat and get a finished song back.</div>
          </button>
          <button class="setup-wizard__card${A.wantMusic === false ? ' setup-wizard__card--selected' : ''}"
                  type="button" data-auto-music="no">
            <div class="setup-wizard__card-title">No, skip music</div>
            <div class="setup-wizard__card-desc">You can add it later from the LLM tab's Music section.</div>
          </button>
        </div>
      `;
    pane.querySelectorAll('[data-auto-music]').forEach((el) => {
      el.addEventListener('click', () => {
        A.wantMusic = el.getAttribute('data-auto-music') === 'yes';
        this._next('plan');
      });
    });
  }

  _next(view) {
    const A = this._w.state.auto;
    A.view = view;
    A.plan = null;
    this._step.render();
  }

  _fillHardwareLine() {
    Promise.resolve(window.ipcBridge.invoke(AutoQuestionPanes.HARDWARE_CHANNEL)).then((r) => {
      if (!r || !r.success || this._w.currentStepId() !== 'auto') return;
      this._w.state.auto.hw = r.hardware;
      const el = this._w.bodyEl.querySelector('#setupAutoHwLine');
      if (el) el.textContent = HardwareText.hardwareLine(r.hardware);
    }).catch(() => {});
  }
}
