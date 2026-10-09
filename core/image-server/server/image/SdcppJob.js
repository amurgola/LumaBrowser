const axios = require('axios');
const SdcppPayload = require('./SdcppPayload');

class SdcppJob {
  static JOBS_PATH = '/sdcpp/v1/jobs';
  static HEALTH_TIMEOUT_MS = 1500;
  static CANCEL_TIMEOUT_MS = 1500;
  static POLL_TIMEOUT_MS = 5000;
  static MAX_SUBMIT_MS = 120000;
  static MAX_BACKOFF_MS = 5000;

  static async healthCheck(baseUrl, headers) {
    try {
      const res = await axios.get(`${baseUrl}${SdcppJob.JOBS_PATH}`, {
        timeout: SdcppJob.HEALTH_TIMEOUT_MS,
        validateStatus: () => true,
        headers,
      });
      return res.status >= 200 && res.status < 600;
    } catch (_) {
      return false;
    }
  }

  static run(options) {
    const job = new SdcppJob(options);
    job._submit();
    return { abort: () => job._abort() };
  }

  constructor(options) {
    this._options = options;
    this._aborted = false;
    this._pollTimer = null;
    this._jobId = null;
    this._pollFailures = 0;
    this._serverCancelSent = false;
    this._startedAt = Date.now();
    this._controller = new AbortController();
  }

  _submit() {
    const { baseUrl, submitPath, body, headers, maxRequestMs } = this._options;
    axios.post(`${baseUrl}${submitPath}`, body, {
      headers: { 'Content-Type': 'application/json', ...headers },
      signal: this._controller.signal,
      timeout: Math.min(maxRequestMs, SdcppJob.MAX_SUBMIT_MS),
      validateStatus: () => true,
    })
      .then((res) => this._onSubmitted(res))
      .catch((err) => {
        if (!this._aborted) this._fail(err);
      });
  }

  _onSubmitted(res) {
    if (this._aborted) return;
    const noun = this._options.noun;
    if (res.status < 200 || res.status >= 300) {
      this._fail(new Error(`sd-server ${noun} submit failed: HTTP ${res.status} ${SdcppPayload.stringify(res.data)}`));
      return;
    }
    const data = res.data || {};
    this._jobId = data.id || (data.result && data.result.id);
    if (!this._jobId) {
      this._fail(new Error(`sd-server ${noun} submit returned no job id: ${SdcppPayload.stringify(data)}`));
      return;
    }
    this._schedulePoll(this._options.pollFirstMs);
  }

  _schedulePoll(delay) {
    if (this._aborted) return;
    this._pollTimer = setTimeout(() => this._pollOnce(), delay);
  }

  async _pollOnce() {
    if (this._aborted || !this._jobId) return;
    if (this._deadlinePassed()) {
      this._fail(new Error(`sd-server ${this._options.noun} request timed out after ${Math.round(this._options.maxRequestMs / 1000)}s.`));
      return;
    }
    try {
      const res = await axios.get(this._jobUrl(), {
        timeout: SdcppJob.POLL_TIMEOUT_MS,
        signal: this._controller.signal,
        validateStatus: () => true,
        headers: this._options.headers,
      });
      if (!this._aborted) this._onPolled(res);
    } catch (err) {
      if (!this._aborted) this._onPollFailed(err);
    }
  }

  _onPolled(res) {
    if (res.status < 200 || res.status >= 300) {
      this._fail(new Error(`sd-server poll failed: HTTP ${res.status} ${SdcppPayload.stringify(res.data)}`));
      return;
    }
    const data = res.data || {};
    this._pollFailures = 0;
    this._emitProgress(data);
    this._emitPreview(data);
    if (data.status === 'completed') this._complete(data);
    else if (data.status === 'failed' || data.error) this._fail(new Error(SdcppPayload.errorMessage(data.error) || `sd-server ${this._options.noun} job failed without a message.`));
    else this._schedulePoll(this._options.pollEveryMs);
  }

  _onPollFailed(err) {
    this._pollFailures += 1;
    if (this._pollFailures > this._options.maxPollFailures) {
      this._fail(new Error(`sd-server ${this._options.noun} polling failed ${this._pollFailures} times: ${SdcppPayload.errorMessage(err)}`));
      return;
    }
    this._schedulePoll(Math.min(SdcppJob.MAX_BACKOFF_MS, this._options.backoffBaseMs * (2 ** this._pollFailures)));
  }

  _complete(data) {
    const payload = this._options.extract(data);
    if (!payload) {
      this._fail(new Error(this._options.emptyMessage(data)));
      return;
    }
    this._stopPolling();
    SdcppJob._safeCall(this._options.onDone, payload);
  }

  _fail(err) {
    if (this._aborted) return;
    this._stopPolling();
    this._abortRequests();
    this._cancelServerJob();
    SdcppJob._safeCall(this._options.onError, err instanceof Error ? err : new Error(String(err)));
  }

  _abort() {
    if (this._aborted) return;
    this._aborted = true;
    this._stopPolling();
    this._abortRequests();
    this._cancelServerJob();
  }

  _cancelServerJob() {
    if (!this._jobId || this._serverCancelSent) return;
    this._serverCancelSent = true;
    axios.delete(this._jobUrl(), { timeout: SdcppJob.CANCEL_TIMEOUT_MS, headers: this._options.headers }).catch(() => {});
  }

  _emitProgress(data) {
    if (!this._options.onProgress) return;
    const progress = SdcppPayload.progressOf(data);
    if (progress) SdcppJob._safeCall(this._options.onProgress, progress);
  }

  _emitPreview(data) {
    if (!this._options.onPreview) return;
    const preview = SdcppPayload.previewOf(data);
    if (preview) SdcppJob._safeCall(this._options.onPreview, preview);
  }

  _stopPolling() {
    if (!this._pollTimer) return;
    clearTimeout(this._pollTimer);
    this._pollTimer = null;
  }

  _abortRequests() {
    try {
      this._controller.abort();
    } catch (_) {}
  }

  _deadlinePassed() {
    return Date.now() - this._startedAt >= this._options.maxRequestMs;
  }

  _jobUrl() {
    return `${this._options.baseUrl}${SdcppJob.JOBS_PATH}/${this._jobId}`;
  }

  static _safeCall(callback, value) {
    try {
      if (callback) callback(value);
    } catch (_) {}
  }
}

module.exports = SdcppJob;
