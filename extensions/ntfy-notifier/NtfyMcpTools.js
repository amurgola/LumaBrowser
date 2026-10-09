const NtfyPublisher = require('./NtfyPublisher');

class NtfyMcpTools {
  static TOOL_NAME = 'send_notification_ntfy';

  static NO_TOPIC_ERROR = 'No ntfy topic is configured. Ask the user to set a default topic in Settings > Extensions > Ntfy Notifications.';

  static TOOLS = [
    {
      name: NtfyMcpTools.TOOL_NAME,
      description: 'Send a push notification to the user\'s phone/desktop through the ntfy server '
        + 'configured in Settings > Extensions > Ntfy Notifications. Delivers `message` to the '
        + 'configured default topic; pass `topic` only when the user names a different one. '
        + 'The server address and any credentials are already configured, never ask the user for them.',
      mutating: true,
      inputSchema: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'The notification body text' },
          title: { type: 'string', description: 'Optional notification title' },
          topic: { type: 'string', description: 'Optional ntfy topic override (letters, digits, - and _). Defaults to the configured topic.' },
          priority: { type: 'number', description: 'Optional priority 1 (min) to 5 (urgent), default 3' },
          tags: { type: 'string', description: 'Optional comma-separated ntfy tags, e.g. "warning,chart"' },
        },
        required: ['message'],
      },
    },
  ];

  constructor() {
    this._getConfig = NtfyMcpTools._unconfigured;
  }

  configure({ getConfig } = {}) {
    if (typeof getConfig === 'function') this._getConfig = getConfig;
  }

  async handle(toolName, args) {
    if (toolName !== NtfyMcpTools.TOOL_NAME) throw new Error(`Unknown ntfy-notifier tool: ${toolName}`);
    const result = await this._send(args || {});
    return NtfyMcpTools._toMcpResult(result);
  }

  async _send(args) {
    const config = this._getConfig() || {};
    const channel = (args.topic && String(args.topic).trim()) || config.topic || '';
    if (!channel) return { success: false, error: NtfyMcpTools.NO_TOPIC_ERROR };
    return NtfyPublisher.send({
      channel,
      message: args.message,
      title: args.title,
      priority: args.priority,
      tags: args.tags,
      url: config.server || NtfyPublisher.DEFAULT_SERVER,
      username: config.username,
      password: config.password,
    });
  }

  static _toMcpResult(result) {
    return { content: [{ type: 'text', text: JSON.stringify(result) }], isError: !result.success };
  }

  static _unconfigured() {
    return { server: NtfyPublisher.DEFAULT_SERVER, topic: '', username: '', password: '' };
  }
}

module.exports = NtfyMcpTools;
