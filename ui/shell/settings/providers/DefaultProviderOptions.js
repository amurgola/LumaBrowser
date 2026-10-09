export default class DefaultProviderOptions {
  static TYPE_LABELS = { openai: 'OpenAI-Compatible', anthropic: 'Anthropic' };

  static build(configs) {
    const seen = new Set();
    const options = [];
    for (const c of configs) {
      const option = c ? DefaultProviderOptions._optionFor(c) : null;
      if (!option || seen.has(option.value)) continue;
      seen.add(option.value);
      options.push(option);
    }
    return options;
  }

  static labelFor(key, options) {
    if (!key || key === 'none') return 'None';
    const opt = options.find((o) => o.value === key);
    return opt ? opt.label : (DefaultProviderOptions.TYPE_LABELS[key] || key);
  }

  static _optionFor(c) {
    if (c.managedByCore) {
      if (!(c.endpoint && c.selectedModel)) return null;
      return { value: c.id, label: c.name || 'Local LLM Server' };
    }
    if (c.peerManaged) {
      if (!(c.endpoint && (c.selectedModel || (Array.isArray(c.models) && c.models.length)))) return null;
      return { value: c.id, label: c.name || 'Shared peer' };
    }
    if (!c.type || !(c.endpoint && c.selectedModel)) return null;
    return { value: c.type, label: DefaultProviderOptions.TYPE_LABELS[c.type] || c.type };
  }
}
