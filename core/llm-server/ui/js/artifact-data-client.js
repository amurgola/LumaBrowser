(function () {
  'use strict';

  const CACHE_PREFIX = 'luma.ad.';
  const DEFAULT_POLL_MS = 10000;

  function cacheRead(rootId) {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + rootId);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || typeof parsed.rev !== 'number') return null;
      return { rev: parsed.rev, data: (parsed.data && typeof parsed.data === 'object') ? parsed.data : {} };
    } catch (_) { return null; }
  }

  function cacheWrite(rootId, rev, data) {
    try { localStorage.setItem(CACHE_PREFIX + rootId, JSON.stringify({ rev, data })); } catch (_) {}
  }

  function ipcTransport(api) {
    return {
      readOnly: false,
      all: (rootId) => api.all(rootId),
      mutate: (rootId, ops) => api.mutate(rootId, ops),
      subscribe: (rootId, onDirty) => api.onChanged((p) => {
        if (p && p.rootId === rootId) onDirty(p.rev);
      }),
    };
  }

  function httpTransport({ base, token, readOnly, pollMs }) {
    const clean = String(base || '').replace(/\/+$/, '');
    const urlFor = (rootId, since) => {
      const qs = [];
      if (since != null) qs.push('since=' + encodeURIComponent(since));
      if (token) qs.push('token=' + encodeURIComponent(token));
      return clean + '/' + encodeURIComponent(rootId) + (qs.length ? '?' + qs.join('&') : '');
    };
    const headers = () => {
      const h = { 'Content-Type': 'application/json' };
      if (token) h.Authorization = 'Bearer ' + token;
      return h;
    };
    const body = async (res) => {
      const b = await res.json().catch(() => null);
      if (!res.ok) return (b && b.error) ? b : { success: false, error: 'HTTP ' + res.status };
      return b || { success: false, error: 'empty response' };
    };
    return {
      readOnly: !!readOnly,
      pollMs: pollMs || DEFAULT_POLL_MS,
      all: async (rootId, since) => {
        const res = await fetch(urlFor(rootId, since), { headers: headers(), credentials: 'same-origin' });
        if (res.status === 204) return { success: true, unchanged: true };
        return body(res);
      },
      mutate: async (rootId, ops) => {
        const res = await fetch(urlFor(rootId), {
          method: 'POST', headers: headers(), credentials: 'same-origin',
          body: JSON.stringify(ops || {}),
        });
        return body(res);
      },
      subscribe: null,
    };
  }

  function shallowCopy(obj) {
    const out = {};
    for (const k of Object.keys(obj)) out[k] = obj[k];
    return out;
  }

  function create(opts) {
    const t = (opts.transport && opts.transport.kind === 'http')
      ? httpTransport(opts.transport)
      : ipcTransport(opts.transport.api);

    let rootId = String(opts.rootId || '');
    let rev = -1;
    let data = {};
    let disposed = false;
    const listeners = new Set();
    let unsubscribe = null;
    let pollTimer = null;

    const cached = cacheRead(rootId);
    if (cached) { rev = cached.rev; data = cached.data; }

    function adopt(snap, changedKeys) {
      if (disposed || !snap || snap.success === false || snap.unchanged) return;
      if (typeof snap.rev !== 'number' || snap.rev <= rev) return;
      if (snap.rootId && snap.rootId !== rootId) rootId = snap.rootId;
      rev = snap.rev;
      data = (snap.data && typeof snap.data === 'object') ? snap.data : {};
      cacheWrite(rootId, rev, data);
      if (listeners.size) {
        const payload = { keys: changedKeys || Object.keys(data), data: shallowCopy(data), rev };
        for (const cb of listeners) { try { cb(payload); } catch (_) {} }
      }
    }

    let hydratePromise = null;
    function hydrate() {
      if (!hydratePromise) {
        hydratePromise = Promise.resolve(t.all(rootId, rev >= 0 ? rev : null))
          .then((snap) => { adopt(snap); return snap; })
          .catch(() => null)
          .finally(() => { hydratePromise = null; });
      }
      return hydratePromise;
    }

    function onDirty(newRev) {
      if (disposed) return;
      if (typeof newRev === 'number' && newRev <= rev) return;
      hydrate();
    }

    function ensureSubscribed() {
      if (disposed || !listeners.size) return;
      if (t.subscribe) {
        if (!unsubscribe) unsubscribe = t.subscribe(rootId, onDirty);
      } else if (!pollTimer) {
        pollTimer = setInterval(() => { hydrate(); }, t.pollMs || DEFAULT_POLL_MS);
      }
    }

    function teardownSubscription() {
      if (unsubscribe) { try { unsubscribe(); } catch (_) {} unsubscribe = null; }
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    }

    async function mutate(ops, touchedKeys) {
      if (t.readOnly) throw new Error('this view is read-only');
      const before = { rev, data: shallowCopy(data) };
      if (ops.set) for (const k of Object.keys(ops.set)) data[k] = ops.set[k];
      if (ops.remove) for (const k of ops.remove) delete data[k];
      cacheWrite(rootId, rev, data);
      const result = await Promise.resolve(t.mutate(rootId, ops)).catch((err) => ({
        success: false, error: (err && err.message) || String(err),
      }));
      if (!result || result.success === false) {
        rev = before.rev; data = before.data;
        cacheWrite(rootId, rev, data);
        throw new Error((result && result.error) || 'artifact data write failed');
      }
      adopt(result, touchedKeys);
      return true;
    }

    hydrate();

    return {
      async get(key) {
        if (rev < 0) await hydrate();
        return data[String(key)];
      },
      async all() {
        if (rev < 0) await hydrate();
        return shallowCopy(data);
      },
      async set(key, value) {
        return mutate({ set: { [String(key)]: value } }, [String(key)]);
      },
      async remove(key) {
        return mutate({ remove: [String(key)] }, [String(key)]);
      },
      onChange(cb) {
        if (typeof cb !== 'function') return () => {};
        listeners.add(cb);
        ensureSubscribed();
        return () => {
          listeners.delete(cb);
          if (!listeners.size) teardownSubscription();
        };
      },
      get readOnly() { return !!t.readOnly; },
      dispose() {
        disposed = true;
        listeners.clear();
        teardownSubscription();
      },
    };
  }

  window.LumaArtifactData = { create };
})();
