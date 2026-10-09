class PublicUrlProbe {
  static DEFAULT_TIMEOUT_MS = 10 * 1000;
  static INFO_PATH = '/sharing/info';

  static async probe(publicUrl, { instanceId, fetch: fetchImpl, timeoutMs = PublicUrlProbe.DEFAULT_TIMEOUT_MS } = {}) {
    const base = PublicUrlProbe._normalizeBase(publicUrl);
    if (!base) return { ok: false, error: 'No public URL configured.' };
    const doFetch = fetchImpl || globalThis.fetch;
    if (typeof doFetch !== 'function') return { ok: false, error: 'fetch is not available in this runtime.' };
    const response = await PublicUrlProbe._request(doFetch, base, timeoutMs);
    if (response.failure) return response.failure;
    return PublicUrlProbe._verify(response.res, base, instanceId);
  }

  static _normalizeBase(publicUrl) {
    return String(publicUrl || '').trim().replace(/\/+$/, '');
  }

  static async _request(doFetch, base, timeoutMs) {
    try {
      const res = await doFetch(base + PublicUrlProbe.INFO_PATH, {
        method: 'GET',
        headers: { accept: 'application/json' },
        redirect: 'follow',
        cache: 'no-store',
        signal: AbortSignal.timeout(timeoutMs),
      });
      return { res };
    } catch (err) {
      return { failure: PublicUrlProbe._connectionFailure(err, base, timeoutMs) };
    }
  }

  static _connectionFailure(err, base, timeoutMs) {
    const name = err && err.name;
    if (name === 'TimeoutError' || name === 'AbortError') {
      return { ok: false, error: `No response from ${base} within ${Math.round(timeoutMs / 1000)}s.` };
    }
    const cause = err && err.cause && err.cause.message;
    return { ok: false, error: `Could not connect to ${base}: ${cause || (err && err.message) || 'unknown error'}` };
  }

  static async _verify(res, base, instanceId) {
    const statusFailure = PublicUrlProbe._statusFailure(res, base);
    if (statusFailure) return statusFailure;
    const body = await PublicUrlProbe._readJson(res);
    if (!body || typeof body !== 'object' || !body.id) {
      return { ok: false, status: res.status, error: `${base} answered, but not with this app's sharing endpoint.` };
    }
    if (instanceId && body.id !== instanceId) {
      return { ok: false, status: res.status, error: `${base} is reachable but points at a different LumaBrowser instance.` };
    }
    return { ok: true, status: res.status };
  }

  static _statusFailure(res, base) {
    if (res.status === 403) {
      return {
        ok: false,
        status: 403,
        error: `${base} answered 403. The sharing policy is blocking the public origin; set Network Sharing to allow any network.`,
      };
    }
    if (!res.ok) return { ok: false, status: res.status, error: `${base} answered HTTP ${res.status}.` };
    return null;
  }

  static async _readJson(res) {
    try { return await res.json(); } catch (_) { return null; }
  }
}

module.exports = PublicUrlProbe;
