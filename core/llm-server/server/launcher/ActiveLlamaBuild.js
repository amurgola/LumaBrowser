class ActiveLlamaBuild {
  static FRAMEWORK_ID = 'llama-cpp';

  static of(llmServerService) {
    if (!llmServerService) return null;
    return ActiveLlamaBuild._chosen(llmServerService.frameworkSelection) || ActiveLlamaBuild._stored(llmServerService);
  }

  static _chosen(selection) {
    return selection && typeof selection.activeBuild === 'function' ? selection.activeBuild(ActiveLlamaBuild.FRAMEWORK_ID) : null;
  }

  static _stored(llmServerService) {
    const defaults = typeof llmServerService.getDefaults === 'function' ? llmServerService.getDefaults() : null;
    return (defaults && defaults.runtimeId) || null;
  }
}

module.exports = ActiveLlamaBuild;
