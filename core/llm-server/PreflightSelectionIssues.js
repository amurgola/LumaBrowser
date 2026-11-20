class PreflightSelectionIssues {
  static IMAGE_DEFAULTS = Object.freeze([
    { field: 'modelId', kind: 'generate', id: 'image-model-missing', what: 'image generation', settingId: 'image.model' },
    { field: 'editModelId', kind: 'edit', id: 'image-edit-model-missing', what: 'image editing', settingId: 'image.edit-model' },
    { field: 'videoModelId', kind: 'video', id: 'image-video-model-missing', what: 'video generation', settingId: 'image.video-model' },
  ]);

  static CORE_OWNER = 'core';
  static PROVIDERS_SETTING = 'aiproviders.providers';

  static AGENTS_SETTING = 'ext.agent-manager.setup';
  static AGENTS_VIEW = 'ext:agent-manager';

  static async collect({ llm, image, llmService, agentManager = null, fileExists }) {
    return [
      ...PreflightSelectionIssues._helper(llm, fileExists),
      ...await PreflightSelectionIssues._imageModels(image),
      ...await PreflightSelectionIssues._slots(llmService),
      ...await PreflightSelectionIssues._agents(llm, agentManager),
    ];
  }

  static _helper(llm, fileExists) {
    const helper = PreflightSelectionIssues._defaults(llm).helperModel;
    if (!helper || !helper.enabled || !helper.modelPath || fileExists(helper.modelPath)) return [];
    return [{
      id: 'llm-helper-model-missing',
      area: 'llm',
      severity: 'error',
      selection: true,
      title: 'Helper model file is missing',
      detail: `The helper model no longer exists at ${helper.modelPath}. Pick another helper model in Setup, or turn the helper off.`,
      fix: { kind: 'open-view', view: 'settings', settingId: 'llm.helper-model-file' },
    }];
  }

  static async _imageModels(image) {
    if (!image || typeof image.listInstalledModels !== 'function') return [];
    const defaults = PreflightSelectionIssues._defaults(image);
    const chosen = PreflightSelectionIssues.IMAGE_DEFAULTS.filter((spec) => defaults[spec.field]);
    if (!chosen.length) return [];
    let installed;
    try { installed = (await image.listInstalledModels()) || []; } catch (_) { return []; }
    return chosen
      .filter((spec) => !installed.some((model) => model.id === defaults[spec.field] && model.kind === spec.kind))
      .map((spec) => PreflightSelectionIssues._imageIssue(spec, defaults[spec.field]));
  }

  static _imageIssue(spec, modelId) {
    return {
      id: spec.id,
      area: 'image',
      severity: 'error',
      selection: true,
      title: `Default ${spec.what} model is not installed`,
      detail: `The model chosen for ${spec.what}, "${modelId}", is no longer installed. Pick another one in Setup, in the Image view.`,
      fix: { kind: 'open-view', view: 'image', settingId: spec.settingId },
    };
  }

  static async _slots(llmService) {
    if (!llmService || typeof llmService.unavailableSlots !== 'function') return [];
    let slots;
    try { slots = (await llmService.unavailableSlots()) || []; } catch (_) { return []; }
    return slots.map((slot) => PreflightSelectionIssues._slotIssue(slot));
  }

  static _slotIssue(slot) {
    const ownedByExtension = slot.extensionId && slot.extensionId !== PreflightSelectionIssues.CORE_OWNER;
    return {
      id: `slot-model-unavailable:${slot.slotId}`,
      area: 'slots',
      severity: 'error',
      selection: true,
      title: `The model chosen for ${slot.label || slot.slotId} is no longer available`,
      detail: `"${slot.model}" is not offered by any configured provider or installed model any more, so this falls back to whatever the provider has loaded or fails. Pick another model in Settings.`,
      fix: ownedByExtension
        ? { kind: 'open-settings', tab: 'extensions', extensionId: slot.extensionId, settingId: `ext.${slot.extensionId}`, selector: slot.picker || null }
        : { kind: 'open-settings', tab: 'aiproviders', extensionId: null, settingId: PreflightSelectionIssues.PROVIDERS_SETTING },
    };
  }

  static async _agents(llm, agentManager) {
    if (!agentManager || typeof agentManager.agentsWithMissingModel !== 'function') return [];
    if (llm && typeof llm.freshInstalledChatModels === 'function') {
      try { await llm.freshInstalledChatModels(); } catch (_) {}
    }
    let agents;
    try { agents = agentManager.agentsWithMissingModel() || []; } catch (_) { return []; }
    return agents.map((agent) => PreflightSelectionIssues._agentIssue(agent));
  }

  static _agentIssue(agent) {
    return {
      id: `agent-model-unavailable:${agent.id}`,
      area: 'agents',
      severity: 'error',
      selection: true,
      title: `The model chosen for the agent "${agent.name || agent.id}" is no longer available`,
      detail: `"${agent.modelRef}" is not installed or offered any more, so this agent runs on the app's default model instead. Pick another model for it in Setup, in the Agents view.`,
      fix: {
        kind: 'open-view',
        view: PreflightSelectionIssues.AGENTS_VIEW,
        settingId: PreflightSelectionIssues.AGENTS_SETTING,
        selector: `[data-agent-id="${String(agent.id).replace(/["\\]/g, '\\$&')}"]`,
      },
    };
  }

  static _defaults(service) {
    try { return (service && service.getDefaults()) || {}; } catch (_) { return {}; }
  }
}

module.exports = PreflightSelectionIssues;
