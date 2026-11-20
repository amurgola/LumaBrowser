const AgentLoopText = require('./AgentLoopText');
const UnfulfilledIntent = require('./UnfulfilledIntent');

class FinalAnswerGate {
  static MAX_EMPTY_RETRIES = 2;

  constructor(options) {
    this._history = options.history;
    this._steps = options.steps;
    this._emit = options.emit;
    this._verifier = options.verifier;
    this._finalCheck = typeof options.finalCheck === 'function' ? options.finalCheck : null;
    this._awaitsLaterResult = typeof options.awaitsLaterResult === 'function' ? options.awaitsLaterResult : () => false;
    this._nativeTools = !!options.nativeTools;
    this._emptyRetries = 0;
    this._stallNudged = false;
    this._callerAsked = false;
  }

  review({ iteration, content, reasoningTail, inLastSteps }) {
    if (inLastSteps) return false;
    if (this._retryEmpty(iteration, content, reasoningTail)) return true;
    if (this._nudgeStall(iteration, content)) return true;
    if (this._nudgeVerify(iteration, content)) return true;
    return this._nudgeCaller(iteration, content);
  }

  _retryEmpty(iteration, content, reasoningTail) {
    if (content.trim() || this._emptyRetries >= FinalAnswerGate.MAX_EMPTY_RETRIES) return false;
    this._emptyRetries += 1;
    this._steps.push({ iteration, assistantContent: '', emptyRetry: this._emptyRetries });
    this._history.popLast();
    this._history.pushToolResult(AgentLoopText.emptyTurnNudge(this._nativeTools), reasoningTail ? AgentLoopText.emptyReplyNotes(reasoningTail) : '');
    return true;
  }

  _nudgeStall(iteration, content) {
    if (this._stallNudged || !UnfulfilledIntent.matches(content) || this._expectsLaterResult()) return false;
    this._stallNudged = true;
    this._steps.push({ iteration, assistantContent: content, stallNudge: true });
    this._history.push('user', AgentLoopText.stallNudge(this._nativeTools));
    return true;
  }

  _expectsLaterResult() {
    try { return !!this._awaitsLaterResult(); } catch (_) { return false; }
  }

  _nudgeVerify(iteration, content) {
    const nudge = this._verifier.takeNudge();
    if (!nudge) return false;
    this._steps.push({ iteration, assistantContent: content, verifyNudge: true });
    this._holdBack(iteration, 'verify', nudge);
    return true;
  }

  _nudgeCaller(iteration, content) {
    if (!this._finalCheck || this._callerAsked) return false;
    this._callerAsked = true;
    let nudge = null;
    try { nudge = this._finalCheck(); } catch (_) {}
    if (!nudge) return false;
    this._steps.push({ iteration, assistantContent: content, finalCheckNudge: true });
    this._holdBack(iteration, 'final-check', nudge);
    return true;
  }

  _holdBack(iteration, reason, nudge) {
    this._emit({ type: 'final-retracted', reason, iteration });
    this._history.push('user', AgentLoopText.heldBack(nudge));
  }
}

module.exports = FinalAnswerGate;
