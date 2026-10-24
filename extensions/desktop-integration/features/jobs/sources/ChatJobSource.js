class ChatJobSource {
  static POLL_MS = 1000;
  static KIND = 'chat';

  constructor({ registry, getRouter, pollMs = ChatJobSource.POLL_MS, setInterval: si = setInterval, clearInterval: ci = clearInterval }) {
    this._registry = registry;
    this._getRouter = getRouter;
    this._pollMs = pollMs;
    this._si = si;
    this._ci = ci;
    this._timer = null;
    this._handle = null;
    this._jobId = null;
    this._canceled = false;
  }

  start() {
    if (this._timer) return;
    this._timer = this._si(() => this.poll(), this._pollMs);
    if (this._timer && typeof this._timer.unref === 'function') this._timer.unref();
    this.poll();
  }

  stop() {
    if (this._timer) this._ci(this._timer);
    this._timer = null;
    this._handle = null;
    this._jobId = null;
  }

  poll() {
    const router = this._router();
    const handle = router ? router.active || null : null;
    if (handle === this._handle) return;
    this._end();
    this._handle = handle;
    if (handle) this._begin(router);
  }

  _begin(router) {
    this._canceled = false;
    this._jobId = this._registry.newId(ChatJobSource.KIND);
    this._registry.start(this._jobId, { kind: ChatJobSource.KIND, title: 'Chat reply', detail: 'Generating', source: 'chat' }, () => {
      this._canceled = true;
      router.abort();
      this.poll();
    });
  }

  _end() {
    if (!this._jobId) return;
    this._registry.finish(this._jobId, this._canceled ? 'canceled' : 'done');
    this._jobId = null;
  }

  _router() {
    try { return this._getRouter() || null; } catch (_) { return null; }
  }
}

module.exports = ChatJobSource;
