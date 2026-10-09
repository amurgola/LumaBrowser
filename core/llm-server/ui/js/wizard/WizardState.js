export default class WizardState {
  static initial() {
    return {
      step: 0, answers: {}, rec: null, hw: null, advanced: '', busy: false,
      mode: null,
      auto: {
        view: 'question', wantImage: null, wantMusic: null, plan: null, busy: false,
        error: null, canceled: false, imageDone: false, imageError: null,
        musicDone: false, musicError: null, modelName: null,
      },
      override: null,
      llmDone: false,
      image: { view: 'ask', rec: null, busy: false, error: null, canceled: false },
    };
  }
}
