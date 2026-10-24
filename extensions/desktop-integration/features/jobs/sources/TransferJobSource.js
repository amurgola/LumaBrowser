class TransferJobSource {
  static STALE_MS = 5 * 60 * 1000;
  static SWEEP_MS = 30 * 1000;

  static CHANNELS = {
    'core.llmServer.modelEvent': TransferJobSource._model('llm-model', 'Downloading model'),
    'core.llmServer.addonEvent': TransferJobSource._model((m) => `llm-addon:${m.id || ''}`, 'Setting up add-on model'),
    'core.llmServer.runtimeEvent': TransferJobSource._runtime('llm-runtime', 'Installing LLM runtime'),
    'core.imageServer.modelEvent': TransferJobSource._model('image-model', 'Downloading image model'),
    'core.imageServer.runtimeEvent': TransferJobSource._runtime('image-runtime', 'Installing image runtime'),
    'core.musicServer.modelEvent': TransferJobSource._model((m) => `music-model:${m.modelId || ''}`, 'Downloading music model'),
    'core.musicServer.runtimeEvent': TransferJobSource._runtime('music-runtime', 'Installing music runtime'),
    'core.voiceServer.event': {
      kind: (m) => (/runtime$/.test(String(m.scope || '')) ? 'runtime-install' : 'model-download'),
      key: (m) => `voice:${m.scope || ''}:${m.id || ''}`,
      title: (m) => TransferJobSource._voiceTitle(m),
      terminal: new Set(['done', 'error', 'canceled', 'finalize']),
    },
    'core.groundingServer.event': TransferJobSource._model((m) => `grounding:${m.id || ''}`, 'Downloading grounding model'),
  };

  static _model(key, title) {
    return { kind: 'model-download', key: typeof key === 'function' ? key : () => key, title: () => title, terminal: new Set(['done', 'error', 'canceled', 'paused']) };
  }

  static _runtime(prefix, title) {
    return { kind: 'runtime-install', key: (m) => `${prefix}:${m.id || ''}`, title: (m) => (m.id ? `${title} (${m.id})` : title), terminal: new Set(['done', 'error', 'canceled', 'finalize']) };
  }

  static _voiceTitle(m) {
    const scope = String(m.scope || '');
    const what = scope.startsWith('tts') ? 'voice' : (scope.startsWith('stt') ? 'speech recognition' : 'speech');
    return scope.endsWith('runtime') ? `Installing ${what} runtime` : `Downloading ${what} model${m.id ? ` (${m.id})` : ''}`;
  }

  constructor({ registry, observe, now = () => Date.now(), setInterval: si = setInterval, clearInterval: ci = clearInterval }) {
    this._registry = registry;
    this._observe = observe;
    this._now = now;
    this._si = si;
    this._ci = ci;
    this._off = null;
    this._timer = null;
    this._streams = new Map();
  }

  start() {
    if (this._off) return;
    this._off = this._observe((channel, message) => this.onMessage(channel, message));
    this._timer = this._si(() => this.sweep(), TransferJobSource.SWEEP_MS);
    if (this._timer && typeof this._timer.unref === 'function') this._timer.unref();
  }

  stop() {
    if (this._off) { try { this._off(); } catch (_) {} }
    this._off = null;
    if (this._timer) this._ci(this._timer);
    this._timer = null;
    this._streams.clear();
  }

  onMessage(channel, message) {
    const spec = TransferJobSource.CHANNELS[channel];
    if (!spec || !message || typeof message !== 'object') return;
    const type = String(message.type || '');
    if (type === 'runtime') return;
    const payload = message.payload || {};
    const key = `${channel}|${spec.key(message)}`;
    let stream = this._streams.get(key);
    if (!stream || !this._registry.isActive(stream.id)) {
      if (spec.terminal.has(type) && type !== 'error') return;
      const kind = typeof spec.kind === 'function' ? spec.kind(message) : spec.kind;
      stream = { id: this._registry.newId(kind), lastAt: 0 };
      this._streams.set(key, stream);
      this._registry.start(stream.id, { kind, title: TransferJobSource._titleFor(spec.title(message), type, payload), source: channel });
    }
    stream.lastAt = this._now();
    if (spec.terminal.has(type)) {
      this._streams.delete(key);
      this._end(stream.id, type, payload);
      return;
    }
    const patch = TransferJobSource.patchFor(type, payload);
    if (type === 'start' || type === 'file-start') {
      const named = TransferJobSource._titleFor(spec.title(message), type, payload);
      if (named) patch.title = named;
    }
    if (Object.keys(patch).length) this._registry.update(stream.id, patch);
  }

  sweep() {
    const cutoff = this._now() - TransferJobSource.STALE_MS;
    for (const [key, stream] of this._streams) {
      if (stream.lastAt < cutoff) {
        this._streams.delete(key);
        this._registry.finish(stream.id, 'done', { detail: 'No progress reported' });
      }
    }
  }

  static patchFor(type, p) {
    switch (type) {
      case 'download': {
        const patch = { detail: 'Downloading' };
        const fraction = TransferJobSource._fraction(p.received, p.total);
        if (fraction !== undefined) patch.progress = fraction;
        if (Number.isFinite(p.etaMs)) patch.eta = p.etaMs / 1000;
        return patch;
      }
      case 'verify': {
        const fraction = TransferJobSource._fraction(p.read, p.total);
        return fraction === undefined ? { detail: 'Verifying' } : { detail: 'Verifying', progress: fraction, eta: null };
      }
      case 'extract': return { detail: 'Extracting', progress: null, eta: null };
      case 'progress': {
        if (Number.isFinite(p.percent)) return { progress: p.percent / 100 };
        const fraction = TransferJobSource._fraction(p.received != null ? p.received : p.step, p.total != null ? p.total : p.totalSteps);
        return fraction === undefined ? {} : { progress: fraction };
      }
      case 'resume': return { detail: 'Resuming' };
      default: return {};
    }
  }

  _end(id, type, payload) {
    if (type === 'error') this._registry.finish(id, 'failed', { error: payload.message || 'Failed' });
    else if (type === 'canceled') this._registry.finish(id, 'canceled');
    else if (type === 'paused') this._registry.finish(id, 'canceled', { detail: 'Paused' });
    else this._registry.finish(id, 'done');
  }

  static _fraction(a, b) {
    const x = Number(a);
    const y = Number(b);
    if (!Number.isFinite(x) || !Number.isFinite(y) || y <= 0) return undefined;
    return x / y;
  }

  static _titleFor(base, type, p) {
    const name = p && (p.file || p.repoId || (type === 'start' ? p.id : null));
    if (!name || typeof name !== 'string') return base;
    return `${base}: ${name.length > 60 ? `${name.slice(0, 59)}...` : name}`;
  }
}

module.exports = TransferJobSource;
