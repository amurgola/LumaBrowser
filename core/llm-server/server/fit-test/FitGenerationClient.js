const axios = require('axios');

class FitGenerationClient {
  static FIT_PROMPT = 'Write exactly 100 words of "lorem ipsum" style placeholder text. Output only the placeholder text: no preamble, no explanation, no list.';
  static GEN_MAX_TOKENS = 256;
  static GEN_TIMEOUT_MS = 180 * 1000;
  static TOKENIZE_TIMEOUT_MS = 30 * 1000;
  static CANCEL_POLL_MS = 500;

  constructor({ http = axios } = {}) {
    this._http = http;
  }

  async generateAndTime(port, cancelled, apiKey, opts = {}) {
    const controller = new AbortController();
    const cancelPoll = setInterval(() => { if (cancelled && cancelled()) controller.abort(); }, FitGenerationClient.CANCEL_POLL_MS);
    const startedAt = Date.now();
    try {
      const res = await this._http.post(
        `http://127.0.0.1:${port}/v1/chat/completions`,
        FitGenerationClient._completionBody(opts),
        { headers: FitGenerationClient._headers(apiKey), timeout: opts.timeoutMs || FitGenerationClient.GEN_TIMEOUT_MS, signal: controller.signal },
      );
      return FitGenerationClient.readTimings(res.data || {}, (Date.now() - startedAt) / 1000);
    } finally {
      clearInterval(cancelPoll);
    }
  }

  async countTokens(port, content, apiKey) {
    try {
      const res = await this._http.post(
        `http://127.0.0.1:${port}/tokenize`,
        { content },
        { headers: FitGenerationClient._headers(apiKey), timeout: FitGenerationClient.TOKENIZE_TIMEOUT_MS },
      );
      const tokens = res.data && res.data.tokens;
      return Array.isArray(tokens) ? tokens.length : null;
    } catch (_) {
      return null;
    }
  }

  static readTimings(data, wallSec) {
    const usage = data.usage || {};
    const timings = data.timings || {};
    const completionTokens = Number(usage.completion_tokens) || null;
    const promptTokens = Number(usage.prompt_tokens) || null;
    const tokensPerSec = FitGenerationClient._decodeRate(timings, completionTokens, wallSec);
    const promptTokensPerSec = FitGenerationClient._prefillRate(timings, promptTokens);
    const promptMs = FitGenerationClient._numOrNull(timings.prompt_ms);
    return {
      completionTokens,
      promptTokens,
      promptMs: FitGenerationClient._round2OrNull(promptMs),
      tokensPerSec: FitGenerationClient._round2OrNull(tokensPerSec),
      promptTokensPerSec: FitGenerationClient._round2OrNull(promptTokensPerSec),
    };
  }

  static _completionBody(opts) {
    return {
      messages: opts.messages || [{ role: 'user', content: FitGenerationClient.FIT_PROMPT }],
      stream: false,
      temperature: 0,
      max_tokens: opts.maxTokens || FitGenerationClient.GEN_MAX_TOKENS,
    };
  }

  static _headers(apiKey) {
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
    return headers;
  }

  static _decodeRate(timings, completionTokens, wallSec) {
    const reported = FitGenerationClient._numOrNull(timings.predicted_per_second);
    if (reported != null) return reported;
    return completionTokens && wallSec > 0 ? completionTokens / wallSec : null;
  }

  static _prefillRate(timings, promptTokens) {
    const reported = FitGenerationClient._numOrNull(timings.prompt_per_second);
    if (reported != null) return reported;
    return promptTokens && FitGenerationClient._numOrNull(timings.prompt_ms)
      ? promptTokens / (timings.prompt_ms / 1000) : null;
  }

  static _numOrNull(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  static _round2OrNull(n) {
    return n != null ? Math.round(n * 100) / 100 : null;
  }
}

module.exports = FitGenerationClient;
