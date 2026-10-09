import StreamFrames from './StreamFrames.js';

export default class ChatStream {
  static COMPLETIONS_URL = '/sharing/llm/v1/chat/completions';
  static ABORT_URL = '/sharing/llm/v1/chat/abort';
  static TURN_HEADER = 'X-Luma-Turn-Id';
  static SIDE_CHANNEL = 'luma.event';

  constructor(http, { cryptoImpl = globalThis.crypto } = {}) {
    this._http = http;
    this._crypto = cryptoImpl;
  }

  async run(opts) {
    const turnId = this.newTurnId();
    this._armAbort(opts.signal, turnId);
    const res = await this._post(opts, turnId);
    await this._checkResponse(res);
    return this._read(res, opts);
  }

  newTurnId() {
    try {
      if (this._crypto && typeof this._crypto.randomUUID === 'function') return 'turn_' + this._crypto.randomUUID();
    } catch (_) {}
    return 'turn_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
  }

  _armAbort(signal, turnId) {
    if (!signal) return;
    const postAbort = () => this._postAbort(turnId);
    if (signal.aborted) postAbort();
    else signal.addEventListener('abort', postAbort, { once: true });
  }

  _postAbort(turnId) {
    try {
      this._http.authed(ChatStream.ABORT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: turnId }),
        keepalive: true,
      }).catch(() => {});
    } catch (_) {}
  }

  _post(opts, turnId) {
    return this._http.authed(ChatStream.COMPLETIONS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [ChatStream.TURN_HEADER]: turnId },
      body: JSON.stringify({
        model: opts.model,
        messages: opts.messages,
        temperature: opts.temperature,
        stream: true,
        agent: !!opts.agent,
        agentId: opts.agentId || undefined,
        attachments: opts.attachments || undefined,
        priorArtifacts: opts.priorArtifacts || undefined,
        reasoning_effort: opts.reasoningEffort || undefined,
      }),
      signal: opts.signal,
    });
  }

  async _checkResponse(res) {
    this._http.throwIfUnauthorized(res);
    if (res.ok) return;
    const data = await res.json().catch(() => ({}));
    throw new Error((data.error && data.error.message) || 'Chat request failed');
  }

  async _read(res, opts) {
    const turn = { content: '', usage: null };
    await StreamFrames.read(res.body, StreamFrames.SSE, (frame) => this._onFrame(frame, turn, opts));
    return turn;
  }

  _onFrame(frame, turn, opts) {
    const line = frame.trim();
    if (!line.startsWith('data:')) return false;
    const payload = line.slice(5).trim();
    if (payload === '[DONE]') return true;
    const json = StreamFrames.json(payload);
    if (!json) return false;
    if (json.object === ChatStream.SIDE_CHANNEL) this._onSideChannel(json, turn, opts);
    else this._onChunk(json, turn, opts);
    return false;
  }

  _onSideChannel(json, turn, opts) {
    if (json.event === 'rollback') {
      const n = Math.min((json.payload && json.payload.chars) || 0, turn.content.length);
      turn.content = turn.content.slice(0, turn.content.length - n);
    }
    if (opts.onEvent) opts.onEvent(json.event, json.payload || {});
  }

  _onChunk(json, turn, opts) {
    if (json.usage) turn.usage = json.usage;
    const delta = json.choices && json.choices[0] && json.choices[0].delta;
    if (!delta) return;
    if (delta.content) {
      turn.content += delta.content;
      if (opts.onDelta) opts.onDelta(delta.content);
    }
    if (delta.reasoning_content && opts.onReasoning) opts.onReasoning(delta.reasoning_content);
  }
}
