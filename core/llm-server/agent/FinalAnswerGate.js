const AgentLoopText = require('./AgentLoopText');
const UnfulfilledIntent = require('./UnfulfilledIntent');

class FinalAnswerGate {
  static MAX_EMPTY_RETRIES = 2;

  constructor(options) {
    this._history = options.history;
    this._steps = options.steps;
    this._emit = options.emit;
    this._verifier = options.verifier;
    this._emptyRetries = 0;
    this._stallNudged = false;
  }

  review({ iteration, content, reasoningTail, inLastSteps }) {
    if (inLastSteps) return false;
    if (this._retryEmpty(iteration, content, reasoningTail)) return true;
    if (this._nudgeStall(iteration, content)) return true;
    return this._nudgeVerify(iteration, content);
  }

  _retryEmpty(iteration, content, reasoningTail) {
    if (content.trim() || this._emptyRetries >= FinalAnswerGate.MAX_EMPTY_RETRIES) return false;
    this._emptyRetries += 1;
    this._steps.push({ iteration, assistantContent: '', emptyRetry: this._emptyRetries });
    this._history.popLast();
    this._history.pushToolResult(AgentLoopText.EMPTY_TURN_NUDGE, reasoningTail ? AgentLoopText.emptyReplyNotes(reasoningTail) : '');
    return true;
  }

  _nudgeStall(iteration, content) {
    if (this._stallNudged || !UnfulfilledIntent.matches(content)) return false;
    this._stallNudged = true;
    this._steps.push({ iteration, assistantContent: content, stallNudge: true });
    this._history.push('user', AgentLoopText.STALL_NUDGE);
    return true;
  }

  _nudgeVerify(iteration, content) {
    const nudge = this._verifier.takeNudge();
    if (!nudge) return false;
    this._steps.push({ iteration, assistantContent: content, verifyNudge: true });
    this._emit({ type: 'final-retracted', reason: 'verify', iteration });
    this._history.push('user', nudge);
    return true;
  }
}

module.exports = FinalAnswerGate;
