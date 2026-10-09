class MonitorTools {
  static NOT_ACTIVE = 'Page Monitors is not active';
  static DEFAULT_HISTORY_LIMIT = 10;

  static TOOLS = [
    {
      name: 'page_monitor_list',
      description: 'List page monitors with their URL, schedule, state (active, paused, checking), last check, last error, and change count',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'page_monitor_create',
      description: 'Create a page monitor that checks a URL on a schedule and alerts when its content changes',
      mutating: true,
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Monitor name' },
          url: { type: 'string', description: 'Page URL to watch' },
          checkIntervalMs: { type: 'number', description: 'Milliseconds between checks (default 300000, five minutes)' },
          selectors: { type: 'array', items: { type: 'string' }, description: 'Optional CSS selectors; only these elements are compared' },
          webhookUrl: { type: 'string', description: 'Optional webhook URL to POST changes to' },
          desktopNotifications: { type: 'boolean', description: 'Show a desktop notification on change (default true)' },
        },
        required: ['name', 'url'],
      },
    },
    {
      name: 'page_monitor_check',
      description: 'Check a page monitor right now and report whether the page changed',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'string', description: 'Monitor ID' } },
        required: ['id'],
      },
    },
    {
      name: 'page_monitor_set_paused',
      description: 'Pause or resume a page monitor',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Monitor ID' },
          paused: { type: 'boolean', description: 'true to pause, false to resume' },
        },
        required: ['id', 'paused'],
      },
    },
    {
      name: 'page_monitor_history',
      description: 'Get recent checks for a page monitor, newest first, including diff summaries for changes',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Monitor ID' },
          limit: { type: 'number', description: 'Maximum entries (default 10)' },
          changedOnly: { type: 'boolean', description: 'Only return checks that detected a change (default true)' },
        },
        required: ['id'],
      },
    },
    {
      name: 'page_monitor_delete',
      description: 'Delete a page monitor and all of its history',
      mutating: true,
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'string', description: 'Monitor ID' } },
        required: ['id'],
      },
    },
  ];

  static HANDLERS = {
    page_monitor_list: (api) => ({ success: true, monitors: api.getAllMonitors().map(MonitorTools.slim) }),
    page_monitor_create: (api, args) => MonitorTools._create(api, args),
    page_monitor_check: (api, args) => MonitorTools._check(api, args),
    page_monitor_set_paused: (api, args) => MonitorTools._setPaused(api, args),
    page_monitor_history: (api, args) => MonitorTools._history(api, args),
    page_monitor_delete: (api, args) => ({ success: api.deleteMonitor(args.id) }),
  };

  static async handle(api, toolName, args = {}) {
    if (!api) throw new Error(MonitorTools.NOT_ACTIVE);
    const run = MonitorTools.HANDLERS[toolName];
    if (!run) throw new Error(`Unknown page_monitor tool: ${toolName}`);
    return run(api, args);
  }

  static slim(m) {
    if (!m) return m;
    return {
      id: m.id,
      name: m.name,
      url: m.url,
      checkIntervalMs: m.check_interval_ms,
      paused: !m.enabled,
      status: m.status || 'idle',
      lastStatus: m.last_status || null,
      lastError: m.last_error || null,
      lastRun: m.last_run || null,
      nextRun: m.next_run || null,
      changeCount: m.change_count || 0,
      selectors: Array.isArray(m.selectors) ? m.selectors : [],
      webhookUrl: m.webhook_url || '',
      desktopNotifications: !!m.desktop_notifications,
    };
  }

  static _create(api, args) {
    const monitor = api.createMonitor({
      name: args.name,
      url: args.url,
      checkIntervalMs: args.checkIntervalMs,
      webhookUrl: args.webhookUrl || '',
      desktopNotifications: args.desktopNotifications !== false,
      enabled: true,
    });
    const hasSelectors = Array.isArray(args.selectors) && args.selectors.length > 0;
    const final = hasSelectors ? api.updateMonitor(monitor.id, { selectors: args.selectors }) : monitor;
    return { success: true, monitor: MonitorTools.slim(api.getMonitor(final.id)) };
  }

  static async _check(api, args) {
    const result = await api.checkMonitorNow(args.id);
    return { success: true, ...result, monitor: MonitorTools.slim(api.getMonitor(args.id)) };
  }

  static _setPaused(api, args) {
    const monitor = api.updateMonitor(args.id, { enabled: !args.paused });
    if (!monitor) return { success: false, error: 'Monitor not found' };
    return { success: true, monitor: MonitorTools.slim(api.getMonitor(args.id)) };
  }

  static _history(api, args) {
    const page = api.getHistoryPaged(args.id, {
      page: 0,
      pageSize: args.limit || MonitorTools.DEFAULT_HISTORY_LIMIT,
      changedOnly: args.changedOnly !== false,
    });
    return {
      success: true,
      total: page.total,
      items: page.items.map((h) => ({
        checkedAt: h.checked_at, changed: !!h.changed, textLength: h.text_length, diffSummary: h.diff_summary || '',
      })),
    };
  }
}

module.exports = MonitorTools;
