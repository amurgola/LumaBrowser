class VoiceViews {
  static stt(service) {
    if (!service || typeof service.getView !== 'function') return { runtimeReady: false, models: [] };
    const view = service.getView() || {};
    return {
      runtimeReady: !!view.runtimeReady,
      models: (view.models || []).map((model) => ({ id: model.id, name: model.name })),
      language: view.language || 'auto',
      serverState: view.serverState || null,
    };
  }

  static tts(service) {
    if (!service || typeof service.getView !== 'function') return { runtimeReady: false, platformSupported: false, models: [] };
    const view = service.getView() || {};
    return {
      runtimeReady: !!view.runtimeReady,
      platformSupported: !!view.platformSupported,
      models: (view.models || []).map((model) => ({ id: model.id, name: model.name, engine: model.engine })),
      modelCatalog: (view.modelCatalog || []).map((model) => ({
        id: model.id, name: model.name, quality: model.quality, sizeBytes: model.sizeBytes, description: model.description,
      })),
      defaultModelId: view.defaultModelId || null,
      workerState: view.workerState || null,
    };
  }

  static notSharedStt() {
    return { runtimeReady: false, models: [] };
  }

  static notSharedTts() {
    return { runtimeReady: false, platformSupported: false, models: [] };
  }
}

module.exports = VoiceViews;
