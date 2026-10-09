class MonitorFields {
  static DEFAULT_INTERVAL_MS = 300000;
  static REQUIRED_ERROR = 'Name and URL are required';
  static INVALID_URL_ERROR = 'Invalid URL';
  static NO_FIELDS_ERROR = 'No fields to update';

  static UPDATABLE = {
    name: ['name', (v) => v],
    url: ['url', (v) => v],
    checkIntervalMs: ['check_interval_ms', (v) => v],
    webhookUrl: ['webhook_url', (v) => v],
    desktopNotifications: ['desktop_notifications', (v) => (v ? 1 : 0)],
    enabled: ['enabled', (v) => (v ? 1 : 0)],
    noRefreshRequired: ['no_refresh_required', (v) => (v ? 1 : 0)],
    intervalJitterPercent: ['interval_jitter_percent', (v) => MonitorFields.clampJitter(v)],
    selectors: ['selectors', (v) => MonitorFields.selectorsColumn(v)],
  };

  static forCreate(data) {
    const input = data || {};
    MonitorFields._assertCreatable(input);
    return {
      name: input.name,
      url: input.url,
      check_interval_ms: input.checkIntervalMs === undefined ? MonitorFields.DEFAULT_INTERVAL_MS : input.checkIntervalMs,
      webhook_url: input.webhookUrl === undefined ? '' : input.webhookUrl,
      desktop_notifications: input.desktopNotifications === undefined || input.desktopNotifications ? 1 : 0,
      enabled: input.enabled === undefined || input.enabled ? 1 : 0,
      no_refresh_required: input.noRefreshRequired ? 1 : 0,
      interval_jitter_percent: MonitorFields.clampJitter(input.intervalJitterPercent),
    };
  }

  static forUpdate(updates = {}) {
    const columns = {};
    for (const [field, [column, convert]] of Object.entries(MonitorFields.UPDATABLE)) {
      if (updates[field] !== undefined) columns[column] = convert(updates[field]);
    }
    if (Object.keys(columns).length === 0) throw new Error(MonitorFields.NO_FIELDS_ERROR);
    return columns;
  }

  static clampJitter(value) {
    return Math.max(0, Math.min(100, Number(value) || 0));
  }

  static selectorsColumn(value) {
    const list = Array.isArray(value) ? value : null;
    return list && list.length > 0 ? JSON.stringify(list) : null;
  }

  static _assertCreatable(input) {
    if (!input.name || !input.url) throw new Error(MonitorFields.REQUIRED_ERROR);
    try {
      new URL(input.url.startsWith('http') ? input.url : `https://${input.url}`);
    } catch (_) {
      throw new Error(MonitorFields.INVALID_URL_ERROR);
    }
  }
}

module.exports = MonitorFields;
