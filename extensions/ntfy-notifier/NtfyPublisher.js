class NtfyPublisher {
  static DEFAULT_SERVER = 'https://ntfy.sh';
  static TIMEOUT_MS = 15 * 1000;
  static MAX_RESPONSE_CHARS = 300;
  static TOPIC_RE = /^[-_A-Za-z0-9]{1,64}$/;

  static async send(params = {}, { fetchImpl = fetch, timeoutMs = NtfyPublisher.TIMEOUT_MS } = {}) {
    const request = NtfyPublisher._buildRequest(params || {});
    if (request.error) return { success: false, error: request.error };
    return NtfyPublisher._post(request, fetchImpl, timeoutMs);
  }

  static _buildRequest(params) {
    const channel = params.channel && String(params.channel).trim();
    const channelError = NtfyPublisher._channelError(channel);
    if (channelError) return { error: channelError };
    const message = params.message != null ? String(params.message) : '';
    if (!message.trim()) return { error: 'send_notification_ntfy requires "message" (the notification text).' };
    const target = NtfyPublisher._resolveTarget(params.url, channel);
    if (target.error) return target;
    return { channel, message, target: target.url, headers: NtfyPublisher._headers(params) };
  }

  static _channelError(channel) {
    if (!channel) return 'send_notification_ntfy requires "channel" (the ntfy topic name).';
    if (!NtfyPublisher.TOPIC_RE.test(channel)) return `"${channel}" is not a valid ntfy topic (letters, digits, - and _ only).`;
    return null;
  }

  static _resolveTarget(url, channel) {
    const server = (url && String(url).trim()) || NtfyPublisher.DEFAULT_SERVER;
    let target;
    try {
      target = new URL(channel, server.endsWith('/') ? server : `${server}/`);
    } catch (_) {
      return { error: `"${server}" is not a valid ntfy server URL.` };
    }
    if (target.protocol !== 'http:' && target.protocol !== 'https:') {
      return { error: 'only http(s) ntfy servers are supported.' };
    }
    return { url: target };
  }

  static _headers(params) {
    const headers = {};
    if (params.title != null && String(params.title).trim()) headers['x-title'] = String(params.title).trim();
    const priority = NtfyPublisher._priority(params.priority);
    if (priority) headers['x-priority'] = priority;
    const tags = NtfyPublisher._tags(params.tags);
    if (tags) headers['x-tags'] = tags;
    const authorization = NtfyPublisher._basicAuth(params.username, params.password);
    if (authorization) headers.authorization = authorization;
    return headers;
  }

  static _priority(value) {
    const prio = value != null ? parseInt(value, 10) : NaN;
    return Number.isFinite(prio) ? String(Math.min(5, Math.max(1, prio))) : null;
  }

  static _tags(value) {
    if (value == null) return null;
    const tags = Array.isArray(value) ? value : String(value).split(',');
    const clean = tags.map((t) => String(t).trim()).filter(Boolean);
    return clean.length ? clean.join(',') : null;
  }

  static _basicAuth(user, pass) {
    const username = user && String(user).trim();
    if (!username) return null;
    const password = pass != null ? String(pass) : '';
    return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
  }

  static async _post({ channel, message, target, headers }, fetchImpl, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    if (timer.unref) timer.unref();
    try {
      const res = await fetchImpl(target.toString(), { method: 'POST', headers, body: message, signal: controller.signal });
      const snippet = await NtfyPublisher._snippet(res);
      if (!res.ok) return NtfyPublisher._rejected(res.status, snippet);
      return {
        success: true,
        status: res.status,
        message: `Notification published to "${channel}" on ${target.origin}. Tell the user it was sent.`,
      };
    } catch (err) {
      return { success: false, error: `send_notification_ntfy failed: ${NtfyPublisher._failureText(err, timeoutMs)}` };
    } finally {
      clearTimeout(timer);
    }
  }

  static async _snippet(res) {
    try { return String(await res.text()).slice(0, NtfyPublisher.MAX_RESPONSE_CHARS); } catch (_) { return ''; }
  }

  static _rejected(status, snippet) {
    const hint = status === 401 || status === 403
      ? ' (the server rejected the credentials, check the username and password in Settings)' : '';
    return { success: false, status, error: `ntfy answered ${status}${hint}${snippet ? `: ${snippet}` : ''}` };
  }

  static _failureText(err, timeoutMs) {
    if (err && err.name === 'AbortError') return `timed out after ${Math.round(timeoutMs / 1000)}s`;
    return (err && err.message) || String(err);
  }
}

module.exports = NtfyPublisher;
