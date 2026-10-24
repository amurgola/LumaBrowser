export default class ComposeIntent {
  constructor(ctx) {
    this._ctx = ctx;
  }

  static is(intent) {
    return !!(intent && intent.compose && typeof intent.compose === 'object');
  }

  async apply(compose) {
    const ctx = this._ctx;
    const { state } = ctx;
    const prompt = String(compose.prompt || '');
    const attachments = Array.isArray(compose.attachments) ? compose.attachments.filter((a) => a && !a.error) : [];
    const canSend = !!compose.autoSend && !state.streaming;
    if (compose.conversationId && canSend) {
      await ctx.convList.refresh();
      await ctx.conversation.open(compose.conversationId);
      state.firstTurn = true;
    } else {
      ctx.conversation.newChat();
    }
    if (attachments.length) ctx.attachments.add(attachments);
    if (canSend && state.modelRef) {
      await ctx.sender.submit(prompt);
      return;
    }
    this._fill(prompt);
  }

  _fill(text) {
    const ta = this._ctx.root.querySelector('.cm-composer textarea');
    if (!ta) return;
    ta.value = text;
    ta.focus();
    ta.dispatchEvent(new Event('input'));
  }
}
