export default class OmniboxResolver {
  static looksLikeUrl(text) {
    const t = (text || '').trim();
    if (!t) return false;
    if (/^[a-z][a-z0-9+.-]*:/i.test(t)) return true;
    if (/\s/.test(t)) return false;
    const hostPart = t.split(/[/?#]/)[0];
    if (/^localhost(:\d+)?$/i.test(hostPart)) return true;
    if (/^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/.test(hostPart)) return true;
    if (/^\[[0-9a-f:]+\](:\d+)?$/i.test(hostPart)) return true;
    if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?$/i.test(hostPart)) return true;
    if (/^[a-z0-9-]+:\d+$/i.test(hostPart)) return true;
    return false;
  }

  static resolve(text, searchUrl) {
    const t = (text || '').trim();
    if (!t) return null;
    if (/^(https?|about|file|luma|chrome|data|blob|ftp|ws|wss):/i.test(t)) return t;
    if (!OmniboxResolver.looksLikeUrl(t)) return searchUrl(t);
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(t)) return t;
    return (OmniboxResolver._plainHttp(t) ? 'http://' : 'https://') + t;
  }

  static _plainHttp(t) {
    const host = t.split(/[/?#]/)[0].replace(/:\d+$/, '').replace(/^\[|\]$/g, '').toLowerCase();
    return host === 'localhost' || host.endsWith('.localhost') || host === '::1'
      || /^(127|10)\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)
      || /^[a-z0-9-]+$/.test(host);
  }
}
