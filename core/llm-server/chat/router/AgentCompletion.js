const CompletionAttempt = require('./CompletionAttempt');
const TransientLlmError = require('./TransientLlmError');

class AgentCompletion {
  static MAX_ATTEMPTS = 3;
  static RETRY_STEP_MS = 500;
  static STALL_TIMEOUT_MS = 10 * 60 * 1000;

  constructor({ dispatch, nativeToolsActive, isBridgeAborted }) {
    this._dispatch = dispatch;
    this._nativeToolsActive = nativeToolsActive;
    this._isBridgeAborted = isBridgeAborted;
  }

  async completeOnce(modelRef, messages, temperature, onStatus, onToken, onReasoningToken, onUsage, onTimings,
    images = [], tools = null, extra = null, ctl = null) {
    const sinks = { onStatus, onToken, onReasoningToken, onUsage, onTimings };
    let last = { success: false, error: 'completion failed' };
    for (let attempt = 1; attempt <= AgentCompletion.MAX_ATTEMPTS; attempt++) {
      if (this._aborted(ctl)) return { success: false, error: 'aborted' };
      last = await this.attempt(modelRef, messages, temperature, sinks, images, tools, extra, AgentCompletion.STALL_TIMEOUT_MS, ctl);
      if (last.success || !TransientLlmError.matches(last.error) || attempt === AgentCompletion.MAX_ATTEMPTS) return last;
      AgentCompletion._noteRetry(onStatus, attempt);
      await new Promise((r) => setTimeout(r, AgentCompletion.RETRY_STEP_MS * attempt));
    }
    return last;
  }

  attempt(modelRef, messages, temperature, sinks = {}, images = [], tools = null, extra = null,
    stallTimeoutMs = AgentCompletion.STALL_TIMEOUT_MS, ctl = null) {
    const nativeTools = !!(this._nativeToolsActive && this._nativeToolsActive(modelRef));
    return new CompletionAttempt({ dispatch: this._dispatch, nativeTools, stallTimeoutMs, ctl, sinks })
      .run(modelRef, messages, temperature, images, tools, extra);
  }

  static _noteRetry(onStatus, attempt) {
    if (!onStatus) return;
    try { onStatus({ phase: 'retrying', attempt }); } catch (_) {}
  }

  _aborted(ctl) {
    if (ctl && typeof ctl.isAborted === 'function') {
      try { return !!ctl.isAborted(); } catch (_) { return false; }
    }
    return !!(this._isBridgeAborted && this._isBridgeAborted());
  }
}

module.exports = AgentCompletion;
