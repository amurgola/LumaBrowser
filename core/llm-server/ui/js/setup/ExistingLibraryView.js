export default class ExistingLibraryView {
  static SOURCE_LABELS = {
    lmstudio: 'LM Studio',
    huggingface: 'the Hugging Face cache',
    ollama: 'Ollama',
    comfyui: 'ComfyUI',
    fooocus: 'Fooocus',
    a1111: 'Stable Diffusion WebUI',
    forge: 'Forge',
    sdnext: 'SD.Next',
    swarmui: 'SwarmUI',
    stabilitymatrix: 'Stability Matrix',
    folder: 'the chosen folder',
  };

  static DEFAULT_LIMIT = 8;

  static view(scan, opts) {
    const limit = Math.max(1, Number(opts && opts.limit) || ExistingLibraryView.DEFAULT_LIMIT);
    const models = ExistingLibraryView.modelsOf(scan);
    const shown = models.slice(0, limit);
    return {
      models,
      shown,
      more: models.length - shown.length,
      bySource: ExistingLibraryView._bySource(scan),
      expanded: models.length >= 1,
    };
  }

  static modelsOf(scan) {
    return (scan && scan.success !== false && Array.isArray(scan.models)) ? scan.models : [];
  }

  static sourceLabel(key) {
    return ExistingLibraryView.SOURCE_LABELS[key];
  }

  static _bySource(scan) {
    return Object.entries((scan && scan.sources) || {})
      .filter(([, n]) => Number(n) > 0)
      .map(([key, n]) => n + ' from ' + (ExistingLibraryView.SOURCE_LABELS[key] || key))
      .join(', ');
  }
}
