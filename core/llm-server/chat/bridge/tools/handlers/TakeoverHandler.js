const ChatToolHandler = require('./ChatToolHandler');

class TakeoverHandler extends ChatToolHandler {
  static NO_USER = 'No user is available to take over in this run. Continue without the blocked step and plainly report what you could not do.';

  names() {
    return ['ask_user_takeover'];
  }

  async execute(_name, _params, ctx) {
    if (!ctx.allowTakeover) return { success: false, error: TakeoverHandler.NO_USER };
    return ctx.takeoverWait.wait();
  }
}

module.exports = TakeoverHandler;
