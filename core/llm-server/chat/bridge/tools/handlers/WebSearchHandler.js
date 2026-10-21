const WebLookup = require('../../../WebLookup');
const ToolProgress = require('../ToolProgress');
const ChatToolHandler = require('./ChatToolHandler');

class WebSearchHandler extends ChatToolHandler {
  names() {
    return ['web_search'];
  }

  async execute(name, params, ctx) {
    return WebLookup.run({
      params, tabRender: ctx.webTabRender, ctxPerSlot: ctx.ctxPerSlot, session: ctx.webSession,
      onProgress: ToolProgress.messenger(ctx, name),
    });
  }
}

module.exports = WebSearchHandler;
