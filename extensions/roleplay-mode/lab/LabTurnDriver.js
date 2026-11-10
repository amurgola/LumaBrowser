const LabCompletionKind = require('../CoreRequire').require('roleplay-lab/LabCompletionKind');

class LabTurnDriver {
  static TITLE = 'Roleplay Lab text run';
  static MODE = 'roleplay';
  static TURN_TIMEOUT_MS = 300000;
  static REACTION_TIMEOUT_MS = 300000;
  static EXTRA_KINDS = [
    { kind: 'judge', test: /critic of interactive fiction|physicality|reveal/i },
    { kind: 'polish', test: /line editor/i },
  ];

  constructor({ router, descriptor = null, modelRef = null, turnTimeoutMs = LabTurnDriver.TURN_TIMEOUT_MS, reactionTimeoutMs = LabTurnDriver.REACTION_TIMEOUT_MS } = {}) {
    if (!router || typeof router.chat !== 'function' || !router.chatStore) throw new Error('LabTurnDriver needs the chat router');
    this._router = router;
    this._descriptor = descriptor;
    this._modelRef = modelRef || (typeof router.resolveModelRef === 'function' ? router.resolveModelRef(null) : null);
    this._turnTimeoutMs = turnTimeoutMs;
    this._reactionTimeoutMs = reactionTimeoutMs;
    this.conversationId = null;
  }

  get store() {
    return this._router.chatStore;
  }

  get modelRef() {
    return this._modelRef;
  }

  static turnFlags(descriptor) {
    return {
      agent: false,
      tools: false,
      disabledTools: [],
      choicesEnabled: !(descriptor && descriptor.choices === false),
      noThink: undefined,
      reasoningEffort: undefined,
      voice: undefined,
      docsSource: false,
    };
  }

  static context(messages) {
    return (Array.isArray(messages) ? messages : [])
      .filter((m) => m && (m.content || m.role === 'user'))
      .map((m) => ({ role: m.role, content: m.content }));
  }

  open(data) {
    if (!this._modelRef) throw new Error('no story model: pass a modelRef or pick a model in the app');
    const conv = this.store.createConversation({ mode: LabTurnDriver.MODE, title: LabTurnDriver.TITLE, hidden: true, modelRef: this._modelRef });
    this.store.setMeta(conv.id, { mode: LabTurnDriver.MODE, data });
    this.conversationId = conv.id;
    return conv.id;
  }

  data() {
    const meta = this.conversationId ? this.store.getMeta(this.conversationId) : null;
    return (meta && meta.data) || {};
  }

  async play(userText) {
    if (!this.conversationId) throw new Error('open() a conversation first');
    const calls = [];
    const stopObserving = this._observe(calls);
    const waiter = new TurnWaiter();
    const controller = new AbortController();
    const started = Date.now();
    try {
      const res = await this._router.chat({
        conversationId: this.conversationId,
        modelRef: this._modelRef,
        messages: LabTurnDriver.context(this.store.listActiveMessages(this.conversationId)).concat([{ role: 'user', content: userText }]),
        userMessage: userText,
        send: (type, payload) => waiter.on(type, payload),
        nested: { signal: controller.signal },
        ...LabTurnDriver.turnFlags(this._descriptor),
      });
      if (!res || !res.success) throw new Error((res && res.error) || 'the turn was not dispatched');
      const messageId = res.assistantMessageId;
      waiter.expect(messageId);
      const done = await waiter.streamed(this._turnTimeoutMs, () => controller.abort());
      const ms = Date.now() - started;
      if (done.type === 'error') throw new Error(done.payload && done.payload.message ? done.payload.message : 'the turn failed');
      await waiter.reacted(this._reactionTimeoutMs);
      const row = this.store.getMessage(messageId) || {};
      const request = calls.find((c) => c.trace && c.trace.callType === 'chat' && c.trace.turnId === messageId) || null;
      return {
        messageId,
        assistant: String(row.content || '').trim(),
        reasoning: row.reasoning || null,
        request: request ? { modelRef: request.modelRef, messages: request.messages, temperature: request.temperature, extra: request.extra } : null,
        calls: calls.map((c) => ({ kind: c.kind, at: c.at })),
        ms,
        aborted: !!(done.payload && done.payload.aborted),
      };
    } finally {
      stopObserving();
    }
  }

  close({ keep = false } = {}) {
    if (!this.conversationId || keep) return;
    try { this.store.deleteConversation(this.conversationId); } catch (_) {}
    this.conversationId = null;
  }

  _observe(calls) {
    if (typeof this._router.observeDispatch !== 'function') return () => {};
    return this._router.observeDispatch((r) => {
      if (!r || !r.trace || r.trace.conversationId !== this.conversationId) return;
      calls.push(Object.assign({ kind: LabTurnDriver.kindOf(r), at: Date.now() }, r));
    });
  }

  static kindOf(request) {
    const trace = request && request.trace;
    if (trace && trace.callType === 'chat') return 'narrator';
    const sys = LabTurnDriver._systemText(request);
    const extra = LabTurnDriver.EXTRA_KINDS.find((k) => k.test.test(sys));
    if (extra) return extra.kind;
    return LabCompletionKind.detect({ messages: request && request.messages }) || (trace && trace.callType) || 'side';
  }

  static _systemText(request) {
    const m = request && Array.isArray(request.messages) ? request.messages[0] : null;
    return m && typeof m.content === 'string' ? m.content.slice(0, 400) : '';
  }
}

class TurnWaiter {
  constructor() {
    this.events = [];
    this._messageId = null;
    this._terminal = null;
    this._reaction = null;
    this._onTerminal = null;
    this._onReaction = null;
  }

  expect(messageId) {
    this._messageId = messageId;
    this._settleReaction();
  }

  on(type, payload) {
    this.events.push({ type, payload });
    if ((type === 'done' || type === 'error') && !this._terminal) {
      this._terminal = { type, payload };
      if (this._onTerminal) this._onTerminal(this._terminal);
    }
    if (TurnWaiter.isReactionEnd(type, payload, this._messageId) && !this._reaction) {
      this._reaction = { type, payload };
      if (this._onReaction) this._onReaction(this._reaction);
    }
  }

  static isReactionEnd(type, payload, messageId) {
    const p = payload || {};
    if (messageId && p.messageId && p.messageId !== messageId) return false;
    if (type === 'mode:reaction') return true;
    if (type === 'mode:world') return true;
    if (type === 'mode:activity') return p.status === 'stopped' || p.status === 'failed';
    if (type === 'mode:progress') return p.done === true;
    return false;
  }

  _settleReaction() {
    if (this._reaction) return;
    const hit = this.events.find((e) => TurnWaiter.isReactionEnd(e.type, e.payload, this._messageId));
    if (hit) { this._reaction = hit; if (this._onReaction) this._onReaction(hit); }
  }

  streamed(timeoutMs, onTimeout) {
    if (this._terminal) return Promise.resolve(this._terminal);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { try { onTimeout(); } catch (_) {} reject(new Error('the story model did not finish within ' + Math.round(timeoutMs / 1000) + ' s')); }, timeoutMs);
      this._onTerminal = (t) => { clearTimeout(timer); resolve(t); };
    });
  }

  reacted(timeoutMs) {
    if (this._reaction) return Promise.resolve(this._reaction);
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), timeoutMs);
      this._onReaction = (r) => { clearTimeout(timer); resolve(r); };
    });
  }
}

LabTurnDriver.TurnWaiter = TurnWaiter;

module.exports = LabTurnDriver;
