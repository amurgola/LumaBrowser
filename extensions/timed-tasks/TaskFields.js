class TaskFields {
  static DEFAULT_INTERVAL_MS = 3600000;
  static MIN_INTERVAL_MS = 60000;
  static MIN_DELAY_MS = 1000;
  static REQUIRED_ERROR = 'Name and request prompt are required';
  static NO_FIELDS_ERROR = 'No fields to update';

  static UPDATABLE = {
    name: ['name', (v) => v],
    requestPrompt: ['request_prompt', (v) => v],
    responsePrompt: ['response_prompt', (v) => v],
    webhookUrl: ['webhook_url', (v) => v],
    repeatInterval: ['repeat_interval', (v) => TaskFields.clampInterval(v)],
    enabled: ['enabled', (v) => (v ? 1 : 0)],
  };

  static clampInterval(value) {
    return Math.max(TaskFields.MIN_INTERVAL_MS, Number(value) || TaskFields.DEFAULT_INTERVAL_MS);
  }

  static nextRun(intervalMs, fromMs) {
    const base = fromMs || Date.now();
    return new Date(base + Math.max(TaskFields.MIN_DELAY_MS, intervalMs || TaskFields.DEFAULT_INTERVAL_MS)).toISOString();
  }

  static forCreate(data) {
    const input = data || {};
    if (!input.name || !input.requestPrompt) throw new Error(TaskFields.REQUIRED_ERROR);
    return {
      name: input.name,
      request_prompt: input.requestPrompt,
      response_prompt: input.responsePrompt === undefined ? '' : input.responsePrompt,
      repeat_interval: TaskFields.clampInterval(input.repeatInterval === undefined ? TaskFields.DEFAULT_INTERVAL_MS : input.repeatInterval),
      webhook_url: input.webhookUrl === undefined ? '' : input.webhookUrl,
      enabled: input.enabled === undefined || input.enabled ? 1 : 0,
    };
  }

  static forUpdate(updates = {}) {
    const columns = {};
    for (const [field, [column, convert]] of Object.entries(TaskFields.UPDATABLE)) {
      if (updates[field] !== undefined) columns[column] = convert(updates[field]);
    }
    if (Object.keys(columns).length === 0) throw new Error(TaskFields.NO_FIELDS_ERROR);
    return columns;
  }
}

module.exports = TaskFields;
