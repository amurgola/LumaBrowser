class ModelStatusNotifier {
  constructor(notify) {
    this._notify = notify;
  }

  watchAll(services) {
    this.watch(services.llmServerService && services.llmServerService.runtimeServer, 'LLM model');
    this.watch(services.whisperServerService && services.whisperServerService.runtimeServer, 'voice recognition model');
    this.watch(services.imageServerService && services.imageServerService.runtimeServer, 'image model');
    this.watch(services.imageServerService && services.imageServerService.editRuntimeServer, 'image-edit model');
    this.watch(services.imageServerService && services.imageServerService.videoRuntimeServer, 'video model');
    this.watch(services.musicServerService && services.musicServerService.server, 'music model');
    this.watch(services.groundingServerService && services.groundingServerService.runtimeServer, 'visual grounding model');
  }

  watch(server, kind) {
    if (!server || typeof server.on !== 'function') return false;
    server.on('state-change', (event) => {
      const entry = ModelStatusNotifier.entryFor(event, ModelStatusNotifier.labelFor(server, kind));
      if (entry) this._notify(entry.message, entry.type);
    });
    return true;
  }

  static labelFor(server, kind) {
    try {
      const plan = server.getStatus().plan;
      const name = plan && (plan.modelName || plan.modelId);
      return name ? `${kind} "${name}"` : kind;
    } catch (_) {
      return kind;
    }
  }

  static entryFor(event, label) {
    const state = event && event.state;
    if (state === 'starting') return { message: `Loading ${label}…`, type: 'info' };
    if (state === 'ready') return { message: `${label} ready`, type: 'success' };
    if (state === 'idle') return { message: `${label} unloaded`, type: 'info' };
    if (state === 'error') {
      const err = event.payload && event.payload.error;
      return { message: `${label} failed to load${err ? `: ${err}` : ''}`, type: 'error' };
    }
    return null;
  }
}

module.exports = ModelStatusNotifier;
