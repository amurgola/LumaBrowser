import TurnFlags from './TurnFlags.js';
import UserMessageComposer from '../composer/UserMessageComposer.js';
import TurnData from '../turns/TurnData.js';
import Dialogs from '../../dialogs/Dialogs.js';
import AttachmentParser from '../../markdown/AttachmentParser.js';

export default class TurnSender {
  static TITLE_SEED_MAX = 40;

  constructor(ctx) {
    this._ctx = ctx;
  }

  async submit(text) {
    const { state } = this._ctx;
    const v = (text || '').trim();
    if ((!v && state.attachments.length === 0) || state.streaming) return;
    if (!state.modelRef) { Dialogs.alert('Pick a model first.'); return; }
    this._ctx.gear.close();
    const turn = this._takeStaged(v);
    const onLanding = !state.activeId;
    if (onLanding) state.firstTurn = true;
    const userMsg = this._userMessage(turn);
    state.messages.push(userMsg);
    this._showUserTurn(userMsg, onLanding, v, turn.images);
    this._startAssistant();
    await this._send({
      userMessage: turn.composed,
      attachments: turn.images.map((im) => ({ kind: 'image', name: im.name, mime: im.mime, base64: im.base64 })),
      context: turn.context.length ? turn.context : undefined,
    });
  }

  async regenerate(target) {
    const { state } = this._ctx;
    if (state.streaming || !state.messages.length) return;
    const idx = TurnSender._targetIndex(state.messages, target);
    if (idx === -1) return;
    const tgt = state.messages[idx];
    state.messages.length = idx;
    this._ctx.conversation.render(this._ctx.main.titleText() || 'Conversation');
    state.firstTurn = false;
    state.regenActive = true;
    this._startAssistant();
    const images = await this.recoverTurnImages(TurnSender._lastUser(state.messages));
    const extra = {};
    if (images.length) extra.attachments = images;
    if (tgt && tgt.id) extra.regenerateMessageId = tgt.id;
    await this._send(extra);
  }

  async resend(m, text) {
    const { state } = this._ctx;
    if (state.streaming) return;
    if (!state.modelRef) { Dialogs.alert('Pick a model first.'); return; }
    const idx = state.messages.indexOf(m);
    if (idx === -1) return;
    const images = await this.recoverTurnImages(m);
    const composed = AttachmentParser.withText(m.content, text);
    state.messages.length = idx;
    const userMsg = { role: 'user', content: composed };
    if (images.length) userMsg.images = images.map((im) => ({ name: im.name, dataUrl: 'data:' + im.mime + ';base64,' + im.base64 }));
    state.messages.push(userMsg);
    this._ctx.conversation.render(this._ctx.main.titleText() || 'Conversation');
    state.firstTurn = false;
    state.regenActive = !!m.id;
    this._startAssistant();
    const extra = { userMessage: composed };
    if (images.length) extra.attachments = images;
    if (m.id) extra.editMessageId = m.id;
    await this._send(extra);
  }

  abort() {
    try { this._ctx.api.chatAbort(); } catch (_) {}
  }

  async recoverTurnImages(m) {
    if (!m) return [];
    if (Array.isArray(m.images) && m.images.length) {
      return m.images.map((im) => {
        const match = /^data:([^;]+);base64,(.*)$/.exec(im.dataUrl || '');
        return match ? { kind: 'image', name: im.name || 'image', mime: match[1], base64: match[2] } : null;
      }).filter(Boolean);
    }
    const arts = TurnData.imageArtifacts(m);
    if (!arts.length) return [];
    const loaded = await Promise.all(arts.map((a) => this._ctx.mediaCache.load(a.id)));
    return loaded.map((e, i) => (e ? { kind: 'image', name: (arts[i] && arts[i].title) || 'image', mime: e.mime, base64: e.b64 } : null))
      .filter(Boolean);
  }

  _takeStaged(v) {
    const { state } = this._ctx;
    const attachments = state.attachments.slice();
    state.attachments = [];
    const context = v ? state.context.map(({ id, ...c }) => c) : [];
    if (v) state.context = [];
    this._ctx.attachments.render();
    return { composed: UserMessageComposer.compose(v, attachments), images: UserMessageComposer.images(attachments), context };
  }

  _userMessage(turn) {
    const userMsg = { role: 'user', content: turn.composed };
    if (turn.context.length) userMsg.context = turn.context;
    if (turn.images.length) {
      userMsg.images = turn.images.map((im) => ({ name: im.name, dataUrl: 'data:' + im.mime + ';base64,' + im.base64 }));
    }
    return userMsg;
  }

  _showUserTurn(userMsg, onLanding, v, images) {
    if (onLanding) {
      const seed = v || (images.length ? (images[0].name || 'Image') : '');
      const max = TurnSender.TITLE_SEED_MAX;
      this._ctx.conversation.render(seed.length > max ? seed.slice(0, max) + '...' : seed);
      return;
    }
    const thread = this._ctx.els.scroll.querySelector('.cm-thread');
    thread.insertBefore(this._ctx.turns.render(userMsg), thread.querySelector('.cm-thread-foot'));
    this._ctx.composer.clearReplyBox();
  }

  _startAssistant() {
    const { state } = this._ctx;
    const asst = { role: 'assistant', content: '', reasoning: '', error: '' };
    state.messages.push(asst);
    state.streamMsg = asst;
    state.streaming = true;
    state.streamConvId = state.activeId || null;
    this._ctx.stream.append();
    this._ctx.composer.setSendStop(true);
    state.newRequestId();
    state.autoScrollPaused = false;
    this._ctx.main.pinBottom();
  }

  async _send(extra) {
    const { api, state } = this._ctx;
    const args = {
      requestId: state.reqId,
      conversationId: state.activeId || undefined,
      modelRef: state.modelRef,
      messages: TurnFlags.context(state.messages),
      ...extra,
      ...TurnFlags.build(state, this._ctx.voice.active()),
    };
    try {
      const res = await api.chat2(args);
      if (res && res.conversationId && !state.activeId && !this._ctx.landing.isShowing()) state.activeId = res.conversationId;
      if (res && res.success === false) this._ctx.finisher.error(res.error || 'request failed', res);
    } catch (err) {
      this._ctx.finisher.error((err && err.message) || 'request failed');
    }
  }

  static _targetIndex(messages, target) {
    if (target) {
      const i = messages.findIndex((m) => m === target || (target.id && m.id && m.id === target.id));
      if (i !== -1) return i;
    }
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return i;
    }
    return -1;
  }

  static _lastUser(messages) {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i] && messages[i].role === 'user') return messages[i];
    }
    return null;
  }
}
