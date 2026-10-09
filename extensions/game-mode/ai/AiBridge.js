const ConversationMeta = require('../ConversationMeta');
const AiCallLimiter = require('./AiCallLimiter');
const AiCallOptions = require('./AiCallOptions');
const AiMessageBuilder = require('./AiMessageBuilder');
const AiReplyParser = require('./AiReplyParser');
const AiToolList = require('./AiToolList');

class AiBridge {
  static BUSY_ERROR = 'too many AI calls in flight for this game; try again in a moment';
  static MAX_JSON_SHAPE = 4000;
  static MAX_RAW = 4000;
  static NUDGE_MAX_TEMPERATURE = 0.5;

  constructor({ chat, getRouter = () => global.__lumaChatRouter } = {}) {
    this._chat = chat;
    this._getRouter = getRouter;
    this._meta = new ConversationMeta(getRouter);
    this._limiter = new AiCallLimiter();
  }

  get load() {
    return this._limiter.load;
  }

  resolveModelRef(conversationId) {
    return this._meta.modelRefFor(conversationId);
  }

  gameFraming(conversationId, fallbackName) {
    const data = this._meta.dataFor(conversationId);
    return {
      name: data.name || fallbackName || 'Untitled game',
      premise: data.premise || '',
      worldNotes: data.worldNotes || '',
      kind: data.kind || 'web',
    };
  }

  async complete(conversationId, body = {}, { game } = {}) {
    if (!this._chat || typeof this._chat.complete !== 'function') return { success: false, error: 'chat completion unavailable' };
    const call = this._prepareCall(conversationId, body, game);
    if (!(await this._limiter.acquire(conversationId))) return { success: false, error: AiBridge.BUSY_ERROR, busy: true };
    try {
      return await this._completeWithNudge(call);
    } catch (e) {
      return { success: false, error: (e && e.message) || 'complete failed' };
    } finally {
      this._limiter.release(conversationId);
    }
  }

  stream(conversationId, body = {}, ext = {}, { game } = {}) {
    const router = this._router();
    if (!router || typeof router.completeStream !== 'function') return AiBridge._fail(ext, 'streaming completion unavailable');
    const req = { system: body.system, messages: body.messages };
    const messages = AiMessageBuilder.build({ game: game || this.gameFraming(conversationId), req });
    const opts = { messages, ...AiCallOptions.from(body, this.resolveModelRef(conversationId)) };
    let handle = { abort: () => {} };
    this._limiter.acquire(conversationId).then((ok) => {
      if (!ok) { AiBridge._fail(ext, AiBridge.BUSY_ERROR); return; }
      handle = this._startStream(router, opts, ext, conversationId) || handle;
    });
    return { abort: () => { try { if (handle.abort) handle.abort(); } catch (_) {} } };
  }

  _prepareCall(conversationId, body, game) {
    const tools = AiToolList.normalize(body.tools);
    const json = AiBridge._jsonMode(body.json);
    const req = { system: body.system, messages: body.messages, json, tools };
    const messages = AiMessageBuilder.build({ game: game || this.gameFraming(conversationId), req });
    return { tools, json, messages, options: AiCallOptions.from(body, this.resolveModelRef(conversationId)) };
  }

  static _jsonMode(json) {
    if (json === true) return true;
    return typeof json === 'string' ? json.slice(0, AiBridge.MAX_JSON_SHAPE) : false;
  }

  async _completeWithNudge(call) {
    let r = await this._chat.complete({ messages: call.messages, ...call.options });
    if (!r || r.error) return AiBridge._completionError(r);
    let parsed = AiReplyParser.parse(r.text, { tools: call.tools, json: call.json });
    if (parsed.kind === 'invalid') {
      r = await this._chat.complete(this._nudgeRequest(call, r.text, parsed.reason));
      if (!r || r.error) return AiBridge._completionError(r);
      parsed = AiReplyParser.parse(r.text, { tools: call.tools, json: call.json });
      if (parsed.kind === 'invalid') {
        return { success: false, error: `model did not follow the output format (${parsed.reason})`, raw: String(r.text || '').slice(0, AiBridge.MAX_RAW) };
      }
    }
    return AiBridge._success(parsed);
  }

  _nudgeRequest(call, replyText, reason) {
    const messages = [
      ...call.messages,
      { role: 'assistant', content: String(replyText || '').slice(0, AiBridge.MAX_RAW) },
      { role: 'user', content: `That reply was not usable (${reason}). Reply again with ONLY the single JSON object described in the instructions.` },
    ];
    const temperature = Math.min(call.options.temperature, AiBridge.NUDGE_MAX_TEMPERATURE);
    return { messages, ...call.options, temperature };
  }

  static _completionError(r) {
    return { success: false, error: (r && r.error) || 'complete failed' };
  }

  static _success(parsed) {
    if (parsed.kind === 'tool') return { success: true, kind: 'tool', name: parsed.name, args: parsed.args, raw: parsed.raw };
    return { success: true, kind: 'final', text: parsed.text, ...(parsed.value !== undefined ? { value: parsed.value } : {}) };
  }

  _startStream(router, opts, ext, conversationId) {
    let released = false;
    const done = () => { if (!released) { released = true; this._limiter.release(conversationId); } };
    try {
      return router.completeStream(opts, {
        onDelta: (t) => AiBridge._safe(ext.onDelta, t),
        onDone: (text) => { done(); AiBridge._safe(ext.onDone, AiReplyParser.unwrapTextObject(AiReplyParser.clean(text))); },
        onError: (e) => { done(); AiBridge._safe(ext.onError, e); },
      });
    } catch (e) {
      done();
      AiBridge._fail(ext, (e && e.message) || 'stream failed');
      return null;
    }
  }

  _router() {
    try { return typeof this._getRouter === 'function' ? this._getRouter() : null; } catch (_) { return null; }
  }

  static _fail(ext, message) {
    AiBridge._safe(ext.onError, new Error(message));
    return { abort: () => {} };
  }

  static _safe(fn, arg) {
    try { if (fn) fn(arg); } catch (_) {}
  }
}

module.exports = AiBridge;
