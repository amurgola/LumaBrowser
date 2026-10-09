const SendWebhookTool = require('../../../SendWebhookTool');
const ChatToolHandler = require('./ChatToolHandler');

class SendWebhookHandler extends ChatToolHandler {
  constructor({ tool = new SendWebhookTool() } = {}) {
    super();
    this._tool = tool;
  }

  names() {
    return ['send_webhook'];
  }

  async execute(_name, params) {
    return this._tool.execute(params);
  }
}

module.exports = SendWebhookHandler;
