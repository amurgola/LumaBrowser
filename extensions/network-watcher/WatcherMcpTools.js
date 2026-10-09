const McpResult = require('../../core/shell/McpResult');
const HeaderRedactor = require('../../core/network-watcher/HeaderRedactor');
const WatcherInput = require('./WatcherInput');
const WatcherIpcHandlers = require('./WatcherIpcHandlers');

class WatcherMcpTools {
  static NOT_ACTIVE = 'Network Watcher is not active';

  static TOOLS = [
    {
      name: 'watcher_list',
      description: 'List all network watchers',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'watcher_add',
      description: 'Add a network watcher that intercepts HTTP responses matching a URL pattern and forwards them to a webhook',
      mutating: true,
      inputSchema: {
        type: 'object',
        properties: {
          urlPattern: { type: 'string', description: 'URL pattern with wildcards (* for any)' },
          sendTo: { type: 'string', description: 'Webhook URL to forward matched responses to (http/https only)' },
          method: { type: 'string', description: 'HTTP method to match (* for all)', default: '*' },
          note: { type: 'string', description: 'Optional description' },
        },
        required: ['urlPattern', 'sendTo'],
      },
    },
    {
      name: 'watcher_remove',
      description: 'Remove a network watcher by ID',
      mutating: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Watcher ID' },
        },
        required: ['id'],
      },
    },
    {
      name: 'watcher_toggle',
      description: 'Enable or disable a network watcher',
      mutating: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Watcher ID' },
          enabled: { type: 'boolean', description: 'Whether to enable or disable' },
        },
        required: ['id', 'enabled'],
      },
    },
  ];

  static HANDLERS = {
    watcher_list: (service) => WatcherMcpTools._list(service),
    watcher_add: (service, args) => WatcherMcpTools._add(service, args),
    watcher_remove: (service, args) => WatcherMcpTools._remove(service, args),
    watcher_toggle: (service, args) => WatcherMcpTools._toggle(service, args),
  };

  static async handle(api, toolName, args = {}) {
    if (!api) throw new Error(WatcherMcpTools.NOT_ACTIVE);
    const run = WatcherMcpTools.HANDLERS[toolName];
    if (!run) throw new Error(`Unknown watcher tool: ${toolName}`);
    try {
      return run(api.getWatcherService(), args || {});
    } catch (error) {
      return McpResult.error(error.message);
    }
  }

  static view(watcher) {
    const json = watcher.toJSON();
    return { ...json, lastCapturedResponse: WatcherMcpTools._redactedCapture(json.lastCapturedResponse) };
  }

  static _list(service) {
    const watchers = service.getAllWatchers().map(WatcherMcpTools.view);
    return McpResult.text({ success: true, watchers, count: watchers.length });
  }

  static _add(service, args) {
    const missing = WatcherInput.missingField(args, 'urlPattern') || WatcherInput.missingField(args, 'sendTo');
    if (missing) return McpResult.error(missing);
    const watcher = service.addWatcher({ urlPattern: args.urlPattern, sendTo: args.sendTo, method: args.method, note: args.note });
    return McpResult.text({ success: true, watcher: WatcherMcpTools.view(watcher), message: 'Network watcher created successfully' });
  }

  static _remove(service, args) {
    const invalid = WatcherInput.idError(args.id);
    if (invalid) return McpResult.error(invalid);
    if (!service.getWatcher(args.id) || !service.removeWatcher(args.id)) return McpResult.error(WatcherIpcHandlers.NOT_FOUND);
    return McpResult.text({ success: true, message: 'Watcher deleted successfully' });
  }

  static _toggle(service, args) {
    const invalid = WatcherInput.idError(args.id) || WatcherInput.enabledError(args.enabled);
    if (invalid) return McpResult.error(invalid);
    const watcher = service.setWatcherEnabled(args.id, args.enabled);
    if (!watcher) return McpResult.error(WatcherIpcHandlers.NOT_FOUND);
    const message = `Watcher ${args.enabled ? 'enabled' : 'disabled'} successfully`;
    return McpResult.text({ success: true, watcher: WatcherMcpTools.view(watcher), message });
  }

  static _redactedCapture(capture) {
    if (!capture || typeof capture !== 'object') return capture;
    return { ...capture, request: HeaderRedactor.redactCapturePayload(capture.request) };
  }
}

module.exports = WatcherMcpTools;
