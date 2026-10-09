import TurnRecorder from './TurnRecorder.js';

export default class ChatTurnRunner {
  static EXPIRED = 'Pairing expired. Reconnect.';

  constructor({ api, store, events }) {
    this._api = api;
    this._store = store;
    this._events = events;
    this._activeAbort = null;
  }

  async chat2(args) {
    const turn = await this._openConversation(args);
    await this._persistPrompt(turn, args);
    await this._openAssistant(turn, args);
    this._emit(turn, 'meta', {
      conversationId: turn.convId, userMessageId: turn.userRow ? turn.userRow.id : undefined,
      assistantMessageId: turn.asstRow.id, userArtifacts: turn.userArtifacts,
    });
    return this._stream(turn, args);
  }

  chatAbort() {
    if (this._activeAbort) {
      try {
        this._activeAbort.abort();
      } catch (_) {}
    }
    return Promise.resolve();
  }

  async _openConversation(args) {
    let conv = args.conversationId ? await this._store.conversations.get(args.conversationId) : null;
    if (!conv) conv = await this._store.conversations.create({});
    return {
      requestId: args.requestId, conv, convId: conv.id, userRow: null, userArtifacts: [], asstRow: null,
      images: (args.attachments || []).filter((a) => a && a.kind === 'image' && a.base64),
      recorder: new TurnRecorder(),
    };
  }

  async _persistPrompt(turn, args) {
    if (args.regenerateMessageId || args.userMessage == null) {
      if (args.regenerateMessageId) await this._store.messages.truncateFrom(turn.convId, args.regenerateMessageId);
      return;
    }
    if (args.editMessageId) await this._store.messages.truncateFrom(turn.convId, args.editMessageId);
    for (const im of turn.images) {
      const art = await this._store.artifacts.put({ conversationId: turn.convId, title: im.name || 'Image', type: 'image', language: im.mime || 'image/png', content: im.base64 });
      turn.userArtifacts.push({ id: art.id, title: art.title, type: 'image' });
    }
    turn.userRow = await this._store.messages.add(turn.convId, {
      role: 'user', content: args.userMessage,
      toolCalls: turn.userArtifacts.length ? { artifacts: turn.userArtifacts } : null,
    });
  }

  async _openAssistant(turn, args) {
    turn.asstRow = await this._store.messages.add(turn.convId, { role: 'assistant', content: '', reasoning: '', modelRef: args.modelRef });
    await this._store.conversations.patch(turn.convId, { modelRef: args.modelRef, toolsEnabled: !!args.agent });
  }

  async _stream(turn, args) {
    const ac = new AbortController();
    this._activeAbort = ac;
    let result;
    try {
      result = await this._api.chat(await this._chatRequest(turn, args, ac.signal));
    } catch (e) {
      this._activeAbort = null;
      return this._failed(turn, e);
    }
    this._activeAbort = null;
    await this._persistAssistant(turn, result && result.content != null ? result.content : '', result && result.usage);
    this._emit(turn, 'done', { usage: result && result.usage, finishReason: 'stop' });
    return this._outcome(turn);
  }

  async _chatRequest(turn, args, signal) {
    const meta = turn.conv && turn.conv.meta;
    const agentId = (meta && meta.mode === 'agent-chat' && meta.data && meta.data.agentId) || undefined;
    const priorArtifacts = await this._priorArtifacts(turn.convId, turn.asstRow.id);
    return {
      model: args.modelRef,
      messages: args.messages,
      agent: !!args.agent,
      agentId,
      attachments: turn.images.length ? turn.images : undefined,
      priorArtifacts: priorArtifacts.length ? priorArtifacts : undefined,
      reasoningEffort: args.reasoningEffort || (turn.conv && turn.conv.reasoningEffort) || undefined,
      signal,
      onDelta: (text) => this._emit(turn, 'delta', { text }),
      onReasoning: (text) => {
        turn.recorder.addReasoning(text);
        this._emit(turn, 'reasoning-delta', { text });
      },
      onEvent: (type, payload) => this._onSideChannel(turn, type, payload),
    };
  }

  _onSideChannel(turn, type, payload) {
    const cacheId = turn.recorder.record(type, payload);
    if (cacheId) this._cacheArtifact(turn, cacheId);
    this._emit(turn, type, payload);
  }

  async _failed(turn, e) {
    if (e && e.unauthorized) {
      this._emit(turn, 'error', { message: ChatTurnRunner.EXPIRED });
      throw e;
    }
    if (e && e.name === 'AbortError') {
      this._emit(turn, 'done', { aborted: true });
      await this._persistAssistant(turn, '');
      return this._outcome(turn);
    }
    const message = (e && e.message) || 'request failed';
    this._emit(turn, 'error', { message });
    await this._store.messages.update(turn.convId, turn.asstRow.id, { error: message });
    return { success: false, error: message, conversationId: turn.convId, assistantMessageId: turn.asstRow.id };
  }

  async _persistAssistant(turn, content, usage) {
    try {
      await this._store.messages.update(turn.convId, turn.asstRow.id, turn.recorder.messagePatch(content, usage));
    } catch (_) {}
  }

  async _priorArtifacts(convId, exceptMessageId) {
    const out = [];
    for (const m of await this._store.messages.list(convId)) {
      if (m.id === exceptMessageId) continue;
      const arts = m.toolCalls && m.toolCalls.artifacts;
      if (!Array.isArray(arts)) continue;
      for (const a of arts) out.push({ id: a.id, title: a.title, type: a.type, rootId: a.rootId, version: a.version });
    }
    return out;
  }

  async _cacheArtifact(turn, artifactId) {
    try {
      const full = await this._api.fetchArtifact(artifactId);
      await this._store.artifacts.put({
        id: artifactId, conversationId: turn.convId, messageId: turn.asstRow.id,
        title: full.title, type: full.type, language: full.mime || full.language, content: full.content,
      });
    } catch (_) {}
  }

  _outcome(turn) {
    return { success: true, conversationId: turn.convId, assistantMessageId: turn.asstRow.id };
  }

  _emit(turn, type, payload) {
    this._events.emit({ requestId: turn.requestId, type, payload });
  }
}
