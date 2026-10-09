const WebLookup = require('../../../WebLookup');
const ChatToolHandler = require('./ChatToolHandler');

class WebSearchHandler extends ChatToolHandler {
  names() {
    return ['web_search'];
  }

  async execute(_name, params, ctx) {
    return WebLookup.run({ params, tabRender: ctx.webTabRender, ctxPerSlot: ctx.ctxPerSlot, session: ctx.webSession });
  }
}

module.exports = WebSearchHandler;
