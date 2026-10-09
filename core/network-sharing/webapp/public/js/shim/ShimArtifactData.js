export default class ShimArtifactData {
  static BASE = '/sharing/artifact-data/';
  static POLL_MS = 10000;

  constructor({ api, win }) {
    this._api = api;
    this._win = win;
    this._listeners = new Set();
    this._watched = new Map();
    this._timer = null;
  }

  surface() {
    return {
      all: (idOrRootId) => this.all(idOrRootId),
      mutate: (idOrRootId, ops) => this.mutate(idOrRootId, ops),
      onChanged: (cb) => this.onChanged(cb),
    };
  }

  async all(idOrRootId) {
    const snap = await this._call(ShimArtifactData.url(idOrRootId));
    if (snap && snap.success && snap.rootId) {
      const prev = this._watched.get(snap.rootId) || 0;
      this._watched.set(snap.rootId, Math.max(prev, snap.rev || 0));
    }
    return snap;
  }

  mutate(idOrRootId, ops) {
    return this._call(ShimArtifactData.url(idOrRootId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ops || {}),
    });
  }

  onChanged(cb) {
    this._listeners.add(cb);
    this._syncPolling();
    return () => {
      this._listeners.delete(cb);
      this._syncPolling();
    };
  }

  async pollOnce() {
    for (const [rootId, rev] of this._watched) {
      const snap = await this._call(ShimArtifactData.url(rootId, rev));
      if (!snap || !snap.success || snap.unchanged || typeof snap.rev !== 'number' || snap.rev <= rev) continue;
      const changedRoot = snap.rootId || rootId;
      this._watched.set(changedRoot, snap.rev);
      this._notify({ rootId: changedRoot, rev: snap.rev, keys: [] });
    }
  }

  static url(id, since) {
    return ShimArtifactData.BASE + encodeURIComponent(id) + (since != null ? '?since=' + encodeURIComponent(since) : '');
  }

  async _call(input, init) {
    try {
      const res = await this._api.authedFetch(input, init);
      if (res.status === 204) return { success: true, unchanged: true };
      const body = await res.json().catch(() => null);
      if (!res.ok) return body && body.error ? { success: false, error: body.error } : { success: false, error: 'HTTP ' + res.status };
      return body || { success: false, error: 'empty response' };
    } catch (err) {
      return { success: false, error: (err && err.message) || 'offline' };
    }
  }

  _syncPolling() {
    if (this._listeners.size && !this._timer) {
      this._timer = this._win.setInterval(() => this.pollOnce(), ShimArtifactData.POLL_MS);
    } else if (!this._listeners.size && this._timer) {
      this._win.clearInterval(this._timer);
      this._timer = null;
      this._watched.clear();
    }
  }

  _notify(event) {
    for (const cb of this._listeners) {
      try {
        cb(event);
      } catch (_) {}
    }
  }
}
