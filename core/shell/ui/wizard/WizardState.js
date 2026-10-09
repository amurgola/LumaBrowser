export default class WizardState {
  static ANTHROPIC_ENDPOINT = 'https://api.anthropic.com';

  static OPENAI_COMPAT_ENDPOINT = 'http://localhost:1234';

  static endpointFor(type) {
    return type === 'anthropic' ? WizardState.ANTHROPIC_ENDPOINT : WizardState.OPENAI_COMPAT_ENDPOINT;
  }

  static initial() {
    return {
      persona: 'chat',
      flow: null,
      auto: WizardState._auto(),
      workflow: null,
      extensionOverrides: new Map(),
      llm: WizardState._llm(),
      image: WizardState._image(),
      webhookUrl: '',
    };
  }

  static _auto() {
    return {
      view: 'question',
      wantImage: null,
      wantMusic: null,
      plan: null,
      hw: null,
      busy: false,
      done: false,
      imageDone: false,
      imageError: null,
      modelName: null,
      error: null,
      canceled: false,
      failedStep: null,
      sysdeps: null,
    };
  }

  static _llm() {
    return {
      mode: null,
      type: 'anthropic',
      endpoint: '',
      apiKey: '',
      selectedModel: '',
      models: [],
      local: WizardState._local(),
    };
  }

  static _local() {
    return {
      view: 'questions',
      answers: {},
      hw: null,
      rec: null,
      advanced: '',
      busy: false,
      done: false,
      modelName: null,
      error: null,
      canceled: false,
      existing: null,
      importRec: null,
    };
  }

  static _image() {
    return {
      view: 'ask',
      rec: null,
      existing: null,
      found: null,
      busy: false,
      resolved: false,
      skipped: false,
      done: false,
      error: null,
      canceled: false,
    };
  }
}
