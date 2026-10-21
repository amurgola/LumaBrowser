const DownloadError = require('./DownloadError');

class DownloadRetry {
  static DEFAULT_ATTEMPTS = 4;
  static BASE_DELAY_MS = 500;
  static MAX_DELAY_MS = 30 * 1000;
  static RETRY_AFTER_CAP_MS = 60 * 1000;
  static JITTER = 0.25;

  static async run(fn, {
    attempts = DownloadRetry.DEFAULT_ATTEMPTS, isStopped = () => false, maxDelayMs = DownloadRetry.MAX_DELAY_MS,
    sleep = DownloadRetry.sleep, random = Math.random, onRetry = null,
  } = {}) {
    let lastError = null;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await fn(attempt);
      } catch (err) {
        lastError = err;
        if (attempt >= attempts || isStopped() || !DownloadRetry.shouldRetry(err)) throw err;
        const delayMs = DownloadRetry.delayFor(attempt, err, { maxDelayMs, random });
        if (onRetry) onRetry({ attempt, delayMs, error: err });
        await sleep(delayMs);
      }
    }
    throw lastError;
  }

  static shouldRetry(err) {
    if (!err) return false;
    if (err instanceof DownloadError) return err.retryable === true;
    if (err.name === 'AbortError' || err.code === 'ERR_CANCELED' || err.canceled) return false;
    const status = err.response && err.response.status;
    if (Number.isFinite(status)) return status === 408 || status === 429 || status >= 500;
    return true;
  }

  static delayFor(attempt, err, { maxDelayMs = DownloadRetry.MAX_DELAY_MS, random = Math.random } = {}) {
    const retryAfter = DownloadRetry._retryAfterOf(err);
    if (retryAfter != null) return Math.min(retryAfter, DownloadRetry.RETRY_AFTER_CAP_MS);
    const base = Math.min(maxDelayMs, DownloadRetry.BASE_DELAY_MS * (2 ** (attempt - 1)));
    const jitter = base * DownloadRetry.JITTER * ((random() * 2) - 1);
    return Math.max(0, Math.round(base + jitter));
  }

  static sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static _retryAfterOf(err) {
    if (!err) return null;
    if (Number.isFinite(err.retryAfterMs)) return err.retryAfterMs;
    const headers = err.response && err.response.headers;
    return headers ? DownloadError.retryAfterMs(headers) : null;
  }
}

module.exports = DownloadRetry;
