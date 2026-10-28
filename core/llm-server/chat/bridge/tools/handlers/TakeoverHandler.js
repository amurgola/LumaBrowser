const ChatToolHandler = require('./ChatToolHandler');

class TakeoverHandler extends ChatToolHandler {
  static NO_USER = 'No user is available to take over in this run. Continue without the blocked step and plainly report what you could not do.';

  names() {
    return ['ask_user_takeover'];
  }

  async execute(_name, params, ctx) {
    if (!ctx.allowTakeover) return { success: false, error: TakeoverHandler.NO_USER };
    const reason = String((params && params.reason) || 'Do what the tab asks, then say you are done.');
    TakeoverHandler._attention(ctx, 'request', reason, { kind: 'takeover', tool: 'ask_user_takeover' });
    try {
      return await ctx.takeoverWait.wait();
    } finally {
      TakeoverHandler._attention(ctx, 'clear');
    }
  }

  static _attention(ctx, method, ...args) {
    const attention = ctx.takeoverAttention;
    if (!attention || typeof attention[method] !== 'function') return;
    try { attention[method](...args); } catch (_) {}
  }
}

module.exports = TakeoverHandler;
