class UrlHeadProbe {
  static TIMEOUT_MS = 30000;

  static async head(url, { fetchImpl = fetch, timeoutMs = UrlHeadProbe.TIMEOUT_MS } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
      return { ok: res.ok, status: res.status, length: res.headers.get('content-length') };
    } catch (err) {
      return { ok: false, status: null, error: err.message };
    } finally {
      clearTimeout(timer);
    }
  }
}

module.exports = UrlHeadProbe;
