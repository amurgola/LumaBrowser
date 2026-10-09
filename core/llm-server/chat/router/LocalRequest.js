const MessageImages = require('./MessageImages');
const FamilySampler = require('./FamilySampler');
const RequestProfile = require('../../server/chat/RequestProfile');

class LocalRequest {
  static SNIPPET_CHARS = 80;

  constructor({ llmServerService, runtimeCatalog, adapterRegistry }) {
    this._service = llmServerService;
    this._catalog = runtimeCatalog;
    this._adapters = adapterRegistry;
  }

  send(messages, temperature, hooks, images, tools, extra, log) {
    const live = this._liveStatus();
    const sendMessages = LocalRequest._withImages(messages, images, live.plan, log);
    const adapter = this._adapterFor(live);
    LocalRequest._logRequest(messages, log);
    this._announceSlotWait(hooks, log);
    return this._dispatch(adapter, live.plan, sendMessages, temperature, hooks, tools, extra, log);
  }

  _liveStatus() {
    const live = this._service.runtimeServer.getStatus();
    if (live.state !== 'ready' || !live.port) throw new Error(`Local server is ${live.state}, not ready.`);
    return live;
  }

  static _withImages(messages, images, plan, log) {
    if (!images.length) return messages;
    const hasVision = !!(plan && plan.mmprojPath);
    log.line(hasVision
      ? `attaching ${images.length} image(s) as vision parts`
      : `local model has no vision projector: ${images.length} image(s) NOT visible; appended a no-vision note`);
    return hasVision ? MessageImages.inject(messages, images) : MessageImages.noteNotVisible(messages, images.length);
  }

  _adapterFor(live) {
    const runtimeId = this._service.getDefaults().runtimeId;
    const entry = this._catalog.getById(runtimeId);
    if (!entry) throw new Error(`Catalog entry for ${runtimeId} not found.`);
    const server = this._service.runtimeServer;
    const plan = server.plan || null;
    const probed = (!entry.request && this._service.getRunningThinking)
      ? RequestProfile.fromThinking(this._service.getRunningThinking())
      : null;
    return this._adapters.createAdapterFor(entry, {
      baseUrl: `http://${live.host || '127.0.0.1'}:${live.port}`,
      apiKey: server.authKey ? server.authKey : null,
      model: plan && plan.apiModelName ? plan.apiModelName : null,
      ...(probed ? { request: probed } : {}),
    });
  }

  _announceSlotWait(hooks, log) {
    const slots = this._service.getLocalSlotCount();
    const busy = this._service.getLocalInFlight();
    if (busy < slots) return;
    log.line(`all ${slots} decode slot(s) busy (${busy} in flight): waiting for a free slot`);
    hooks.onStatus({ phase: 'waiting-for-slot', inFlight: busy, slots });
  }

  _dispatch(adapter, plan, messages, temperature, hooks, tools, extra, log) {
    const settle = this._countRequest();
    const sentAt = Date.now();
    let firstToken = false;
    const handle = adapter.chat({
      messages,
      temperature,
      familySamplerDefaults: FamilySampler.forTurn(plan, extra),
      tools: (tools && tools.length) ? tools : undefined,
      chatTemplateKwargs: extra && extra.chatTemplateKwargs,
      reasoningBudget: extra && extra.reasoningBudget,
      maxTokens: extra && extra.maxTokens,
      onDelta: (t) => {
        if (!firstToken) { firstToken = true; log.line(`first token after ${Date.now() - sentAt}ms`); }
        hooks.onDelta(t);
      },
      onReasoningDelta: (t) => hooks.onReasoningDelta(t),
      onDone: (summary) => {
        settle();
        log.line(`done: total ${log.elapsedMs()}ms`);
        this._service.runtimeServer.markActive();
        hooks.onDone(summary || {});
      },
      onError: (err) => {
        settle();
        log.line(`error after ${log.elapsedMs()}ms: ${err && err.message}`);
        hooks.onError(err);
      },
    });
    return { ...handle, abort: () => { settle(); try { handle.abort(); } catch (_) {} } };
  }

  _countRequest() {
    this._service.noteLocalRequestStart();
    let settled = false;
    return () => {
      if (settled) return;
      settled = true;
      this._service.noteLocalRequestEnd();
    };
  }

  static _logRequest(messages, log) {
    const promptChars = messages.reduce((sum, m) => sum + ((m && m.content && String(m.content).length) || 0), 0);
    const lastUser = [...messages].reverse().find((m) => m && m.role === 'user');
    const text = lastUser ? String(lastUser.content || '') : '';
    const snippet = lastUser ? text.slice(0, LocalRequest.SNIPPET_CHARS).replace(/\n/g, ' ') : '(no user msg)';
    const more = text.length > LocalRequest.SNIPPET_CHARS ? '…' : '';
    log.line(`POST /v1/chat/completions: messages=${messages.length} promptChars=${promptChars} lastUser="${snippet}${more}"`);
  }
}

module.exports = LocalRequest;
