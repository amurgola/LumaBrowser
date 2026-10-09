import WorkflowPresets from './WorkflowPresets.js';

export default class WizardSteps {
  static build(state, enabledIds) {
    if (state.flow === 'auto') {
      return [{ id: 'persona', label: 'Start' }, { id: 'auto', label: 'Automatic Setup' }, { id: 'done', label: 'Finish' }];
    }
    const steps = [{ id: 'persona', label: 'Start' }];
    if (state.flow === 'guided') steps.push(...WizardSteps._guided(state, enabledIds));
    steps.push({ id: 'done', label: 'Finish' });
    return steps;
  }

  static _guided(state, enabledIds) {
    const picked = state.workflow !== null;
    const scanFirst = state.persona === 'switch';
    const steps = [];
    if (scanFirst) steps.push({ id: 'llm', label: 'Your models' });
    steps.push({ id: 'workflow', label: 'Workflow' });
    if (state.workflow === 'custom') steps.push({ id: 'features', label: 'Features' });
    if (picked && WorkflowPresets.needsLlm(enabledIds) && !scanFirst) steps.push({ id: 'llm', label: 'LLM Provider' });
    if (picked) steps.push({ id: 'image', label: 'Image Gen' });
    if (picked && enabledIds.includes('notification-interceptor')) steps.push({ id: 'webhook', label: 'Webhook' });
    return steps;
  }

  static isValid(stepId, state, enabledCount) {
    switch (stepId) {
      case 'persona': return true;
      case 'auto': return state.auto.done === true;
      case 'workflow': return state.workflow !== null;
      case 'features': return enabledCount > 0;
      case 'llm': return WizardSteps._llmReady(state.llm);
      case 'image': return state.image.resolved === true;
      case 'webhook': return true;
      case 'done': return true;
      default: return false;
    }
  }

  static _llmReady(llm) {
    if (llm.mode === 'local') return llm.local.done === true;
    return !!(llm.endpoint && llm.apiKey && llm.selectedModel);
  }
}
