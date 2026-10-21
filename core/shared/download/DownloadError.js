const HubAuth = require('./HubAuth');

class DownloadError extends Error {
  static ACCESS_DENIED = 'HF_ACCESS_DENIED';
  static NOT_FOUND = 'DOWNLOAD_NOT_FOUND';
  static INTEGRITY = 'DOWNLOAD_INTEGRITY';
  static NO_SPACE = 'DOWNLOAD_NO_SPACE';
  static UNSAFE_PATH = 'DOWNLOAD_UNSAFE_PATH';
  static HTTP = 'DOWNLOAD_HTTP';
  static NETWORK = 'DOWNLOAD_NETWORK';

  static TERMINAL_STATUSES = [401, 403, 404];

  constructor(message, { code, status = null, retryable = false, retryAfterMs = null } = {}) {
    super(message);
    this.name = 'DownloadError';
    this.code = code;
    this.status = status;
    this.retryable = retryable;
    this.retryAfterMs = retryAfterMs;
  }

  static is(err, code) {
    return !!err && err instanceof DownloadError && (code === undefined || err.code === code);
  }

  static integrity(message) {
    return new DownloadError(message, { code: DownloadError.INTEGRITY });
  }

  static noSpace(message) {
    return new DownloadError(message, { code: DownloadError.NO_SPACE });
  }

  static unsafePath(message) {
    return new DownloadError(message, { code: DownloadError.UNSAFE_PATH });
  }

  static fromStatus(status, { url = '', forLabel = '', headers = {} } = {}) {
    if ((status === 401 || status === 403) && HubAuth.isHubUrl(url)) return DownloadError._hubAccess(status, forLabel);
    if (status === 404) {
      return new DownloadError(`Download failed${forLabel}: the file is not there (HTTP 404). It may have been moved or removed upstream.`,
        { code: DownloadError.NOT_FOUND, status });
    }
    const retryable = status === 408 || status === 429 || status >= 500;
    return new DownloadError(`Download request failed${forLabel}: HTTP ${status}`, {
      code: DownloadError.HTTP, status, retryable, retryAfterMs: DownloadError.retryAfterMs(headers),
    });
  }

  static fromRequest(err, { url = '', forLabel = '' } = {}) {
    if (err instanceof DownloadError) return err;
    const response = err && err.response;
    if (response && Number.isFinite(response.status)) {
      return DownloadError.fromStatus(response.status, { url, forLabel, headers: response.headers || {} });
    }
    const message = (err && err.message) || String(err);
    return new DownloadError(`Download request failed${forLabel}: ${message}`, { code: DownloadError.NETWORK, retryable: true });
  }

  static retryAfterMs(headers) {
    const raw = headers && (headers['retry-after'] || headers['Retry-After']);
    if (raw == null || raw === '') return null;
    const text = String(raw).trim();
    if (/^\d+$/.test(text)) return Number(text) * 1000;
    const at = Date.parse(text);
    return Number.isFinite(at) ? Math.max(0, at - Date.now()) : null;
  }

  static _hubAccess(status, forLabel) {
    const why = HubAuth.hasToken()
      ? 'Your HF_TOKEN does not have access to it: accept the licence on the model page, or use a token with read access.'
      : 'No HF_TOKEN is set: add a Hugging Face token that has access to the repo and try again.';
    return new DownloadError(
      `Hugging Face refused the download${forLabel} (HTTP ${status}): this repo is gated or private. ${why}`,
      { code: DownloadError.ACCESS_DENIED, status });
  }
}

module.exports = DownloadError;
