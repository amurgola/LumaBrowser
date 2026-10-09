const NtfyPublisher = require('./NtfyPublisher');
const NtfySettings = require('./NtfySettings');

class NtfyNotifierExtension {
  static TEST_TITLE = 'LumaBrowser';
  static TEST_MESSAGE = 'Test notification from LumaBrowser. If you can read this, ntfy is set up.';

  constructor({ mcpTools = null, send = NtfyPublisher.send } = {}) {
    this._mcpTools = mcpTools;
    this._send = send;
    this._settings = new NtfySettings(null);
  }

  async activate(context) {
    this._settings = new NtfySettings(context.db);
    this._wireTool();
    this._registerIpc(context.ipc);
    console.log('ntfy-notifier: activated (tool: send_notification_ntfy)');
    return {};
  }

  async deactivate() {
    this._settings = new NtfySettings(null);
  }

  async sendTest() {
    const config = this._settings.read();
    if (!config.topic) return { success: false, error: 'Set a default topic first.' };
    return this._send({
      channel: config.topic,
      url: config.server,
      username: config.username,
      password: config.password,
      title: NtfyNotifierExtension.TEST_TITLE,
      message: NtfyNotifierExtension.TEST_MESSAGE,
    });
  }

  settings() {
    return this._settings;
  }

  _wireTool() {
    try {
      const mcpTools = this._mcpTools || require('./mcp-tools.js');
      mcpTools.configure({ getConfig: () => this._settings.read() });
    } catch (err) {
      console.error('ntfy-notifier: failed to wire tool config:', err.message);
    }
  }

  _registerIpc(ipc) {
    ipc.handle('getSettings', async () => this._settings.view());
    ipc.handle('saveSettings', async (event, patch) => this._settings.save(patch));
    ipc.handle('sendTest', async () => this.sendTest());
  }
}

module.exports = NtfyNotifierExtension;
