import PendingMessagesHtml from './PendingMessagesHtml.js';
import PendingQueue from './PendingQueue.js';
import ComposerStrip from '../composer/ComposerStrip.js';

export default class PendingMessages extends ComposerStrip {
  static ORDER = 30;

  constructor(ctx) {
    super(ctx, 'cm-pending-strip', PendingMessages.ORDER);
    this._queue = new PendingQueue();
  }

  add(text) {
    const { state, sender, composer } = this._ctx;
    const typed = (text || '').trim();
    if (!state.activeId || (!typed && state.attachments.length === 0)) return false;
    this._queue.add(state.activeId, sender.takeStaged(typed));
    composer.clearReplyBox();
    composer.refreshSendState();
    this.paint();
    return true;
  }

  onTurnEnd(conversationId, finished) {
    if (conversationId && finished) this._queue.release(conversationId);
    else if (conversationId && this._queue.list(conversationId).length) this._queue.hold(conversationId);
    this.sendNext();
  }

  sendNext() {
    const { state, sender } = this._ctx;
    const conversationId = state.activeId;
    const ready = conversationId && !state.streaming && state.modelRef && !this._queue.isHeld(conversationId);
    const next = ready ? this._queue.shift(conversationId) : null;
    this.paint();
    if (next) sender.sendStaged(next);
  }

  html() {
    const { state } = this._ctx;
    const conversationId = state.activeId;
    if (!conversationId) return '';
    return PendingMessagesHtml.build(this._queue.list(conversationId), {
      held: this._queue.isHeld(conversationId),
      canSend: !state.streaming,
    });
  }

  onClick(event) {
    const conversationId = this._ctx.state.activeId;
    const remove = ComposerStrip.target(event, 'data-pending-remove');
    const edit = ComposerStrip.target(event, 'data-pending-edit');
    if (remove) this._queue.remove(conversationId, remove.getAttribute('data-pending-remove'));
    else if (edit) this._backToComposer(this._queue.remove(conversationId, edit.getAttribute('data-pending-edit')));
    else if (ComposerStrip.target(event, 'data-pending-send')) { this._carryOn(conversationId); return; }
    else return;
    this.paint();
  }

  _carryOn(conversationId) {
    if (this._ctx.state.streaming) return;
    this._queue.release(conversationId);
    this.sendNext();
  }

  _backToComposer(item) {
    if (!item) return;
    const { state, els, attachments, composer } = this._ctx;
    state.attachments = [...item.attachments, ...state.attachments];
    state.context = [...item.context, ...state.context];
    attachments.render();
    const box = els.composerBar.querySelector('.cm-composer textarea');
    if (!box) return;
    box.value = [item.text, box.value].filter(Boolean).join('\n');
    box.dispatchEvent(new Event('input'));
    composer.focus();
  }
}
