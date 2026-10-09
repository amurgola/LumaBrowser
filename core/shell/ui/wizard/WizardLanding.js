import WizardPersonas from './WizardPersonas.js';

export default class WizardLanding {
  static call(state, hasLlm) {
    if (state.flow === 'auto' && state.auto.done) return ['core.llmServer.openChat'];
    if (WizardPersonas.SETUP_LANDING.has(state.persona) && hasLlm && state.llm.mode === 'local') {
      return state.persona === 'switch'
        ? ['core.llmServer.openSetup', { expand: 'plan' }]
        : ['core.llmServer.openSetup'];
    }
    return null;
  }
}
