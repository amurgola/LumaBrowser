class RenderJobSource {
  static RETRY_MS = 2000;
  static KINDS = {
    image: { title: 'Generating image', detail: 'Rendering' },
    video: { title: 'Rendering video', detail: 'Rendering' },
    music: { title: 'Generating music', detail: 'Generating' },
  };

  static PHASES = {
    'starting-server': 'Starting the model server',
    'loading-model': 'Loading the model',
    'rendering-image': 'Rendering',
    'rendering-video': 'Rendering',
    generating: 'Generating',
  };

  constructor({ registry, getRouters, retryMs = RenderJobSource.RETRY_MS, setInterval: si = setInterval, clearInterval: ci = clearInterval }) {
    this._registry = registry;
    this._getRouters = getRouters;
    this._retryMs = retryMs;
    this._si = si;
    this._ci = ci;
    this._timer = null;
    this._wrapped = new Map();
  }

  start() {
    this.attach();
    if (this._wrapped.size < Object.keys(RenderJobSource.KINDS).length && !this._timer) {
      this._timer = this._si(() => { if (this.attach() === Object.keys(RenderJobSource.KINDS).length) this._stopTimer(); }, this._retryMs);
      if (this._timer && typeof this._timer.unref === 'function') this._timer.unref();
    }
  }

  attach() {
    let routers = {};
    try { routers = this._getRouters() || {}; } catch (_) { routers = {}; }
    for (const kind of Object.keys(RenderJobSource.KINDS)) {
      const router = routers[kind];
      if (this._wrapped.has(kind) || !router || typeof router.generate !== 'function') continue;
      this._wrap(kind, router);
    }
    return this._wrapped.size;
  }

  stop() {
    this._stopTimer();
    for (const { router, wrapper, state } of this._wrapped.values()) {
      state.live = false;
      if (Object.prototype.hasOwnProperty.call(router, 'generate') && router.generate === wrapper && state.hadOwn === false) {
        delete router.generate;
      } else if (router.generate === wrapper && state.hadOwn) {
        router.generate = state.original;
      }
    }
    this._wrapped.clear();
  }

  _stopTimer() {
    if (this._timer) this._ci(this._timer);
    this._timer = null;
  }

  _wrap(kind, router) {
    const original = router.generate;
    const state = { live: true, original, hadOwn: Object.prototype.hasOwnProperty.call(router, 'generate') };
    const source = this;
    const wrapper = function generate(request) {
      if (!state.live) return original.call(this === undefined ? router : this, request);
      return source._run(kind, router, original, request);
    };
    router.generate = wrapper;
    this._wrapped.set(kind, { router, wrapper, state });
  }

  async _run(kind, router, original, request) {
    const req = request && typeof request === 'object' ? request : {};
    const info = RenderJobSource.KINDS[kind];
    const id = this._registry.newId(kind);
    let canceled = false;
    this._registry.start(id, { kind, title: RenderJobSource._title(info.title, req), detail: info.detail, source: kind }, () => {
      canceled = true;
      router.abort();
    });
    const callerSend = typeof req.send === 'function' ? req.send : null;
    const send = (type, payload) => {
      this._onEvent(id, type, payload);
      if (callerSend) callerSend(type, payload);
    };
    let result;
    try {
      result = await original.call(router, { ...req, send });
    } catch (err) {
      this._registry.finish(id, 'failed', { error: (err && err.message) || String(err) });
      throw err;
    }
    this._finish(id, result, canceled);
    return result;
  }

  _onEvent(id, type, payload) {
    const p = payload || {};
    if (type === 'progress') {
      const total = Number(p.totalSteps);
      const step = Number(p.step);
      if (Number.isFinite(total) && total > 0 && Number.isFinite(step)) this._registry.update(id, { progress: step / total, detail: `Step ${step} of ${total}` });
    } else if (type === 'status' && p.phase) {
      this._registry.update(id, { detail: RenderJobSource.PHASES[p.phase] || String(p.phase) });
    }
  }

  _finish(id, result, canceled) {
    const r = result || {};
    if (r.success) this._registry.finish(id, 'done');
    else if (canceled || r.aborted || r.error === 'aborted') this._registry.finish(id, 'canceled');
    else this._registry.finish(id, 'failed', { error: r.error || 'Generation failed' });
  }

  static _title(base, req) {
    const prompt = typeof req.prompt === 'string' ? req.prompt : (typeof req.lyrics === 'string' ? req.lyrics : '');
    const text = prompt.replace(/\s+/g, ' ').trim();
    if (!text) return base;
    return `${base}: ${text.length > 48 ? `${text.slice(0, 47)}...` : text}`;
  }
}

module.exports = RenderJobSource;
