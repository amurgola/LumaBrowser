export default class SlotModelOptions {
  static DEFAULT_LABEL = 'Use active provider (default)';
  static UNAVAILABLE_PREFIX = 'Unavailable: ';
  static SEPARATOR = '::';

  static fill(select, models, slotConfig) {
    const rows = Array.isArray(models) ? models : [];
    const chosen = SlotModelOptions.valueOf(slotConfig);
    select.textContent = '';
    select.appendChild(SlotModelOptions._option('', SlotModelOptions.DEFAULT_LABEL));
    for (const row of rows) select.appendChild(SlotModelOptions._option(SlotModelOptions._value(row.providerId, row.modelId), row.label));
    if (SlotModelOptions.isMissing(rows, slotConfig)) select.appendChild(SlotModelOptions._missingOption(slotConfig));
    select.value = chosen;
    if (select.value !== chosen) select.value = '';
  }

  static isMissing(models, slotConfig) {
    if (!slotConfig || slotConfig.explicit !== true || !slotConfig.provider || !slotConfig.model) return false;
    return !(models || []).some((row) => row.providerId === slotConfig.provider && row.modelId === slotConfig.model);
  }

  static labelFor(models, slotConfig) {
    const row = (models || []).find((m) => m.providerId === slotConfig.provider && m.modelId === slotConfig.model);
    if (row && row.label) return row.label;
    return SlotModelOptions.isMissing(models, slotConfig) ? SlotModelOptions.UNAVAILABLE_PREFIX + slotConfig.model : slotConfig.model;
  }

  static valueOf(slotConfig) {
    return slotConfig && slotConfig.provider && slotConfig.model ? SlotModelOptions._value(slotConfig.provider, slotConfig.model) : '';
  }

  static parse(value) {
    const [provider, ...rest] = String(value || '').split(SlotModelOptions.SEPARATOR);
    const model = rest.join(SlotModelOptions.SEPARATOR);
    return provider && model ? { provider, model } : null;
  }

  static _missingOption(slotConfig) {
    const option = SlotModelOptions._option(SlotModelOptions.valueOf(slotConfig), SlotModelOptions.UNAVAILABLE_PREFIX + slotConfig.model);
    option.disabled = true;
    option.dataset.unavailable = 'true';
    return option;
  }

  static _value(providerId, modelId) {
    return `${providerId}${SlotModelOptions.SEPARATOR}${modelId}`;
  }

  static _option(value, text) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    return option;
  }
}
