const AgentLoopText = require('./AgentLoopText');

class CompletionVerifier {
  static MAX_NUDGES = 1;
  static ACTION_TOOLS = new Set(['click', 'click_at', 'type', 'press_key', 'locate']);
  static READ_TOOLS = new Set([
    'get_source', 'observe_page', 'screenshot', 'get_element', 'extract_data',
    'wait_for', 'navigate', 'create_tab',
  ]);

  static next(prev, tool, result) {
    const ok = !!result && result.success !== false;
    if (CompletionVerifier.ACTION_TOOLS.has(tool)) return CompletionVerifier._afterAction(prev, tool, result, ok);
    if (ok && CompletionVerifier.READ_TOOLS.has(tool)) return null;
    return prev;
  }

  constructor() {
    this._unverified = null;
    this._nudges = 0;
  }

  observe(tool, result) {
    this._unverified = CompletionVerifier.next(this._unverified, tool, result);
  }

  takeNudge() {
    if (!this._unverified || this._nudges >= CompletionVerifier.MAX_NUDGES) return null;
    this._nudges += 1;
    const text = AgentLoopText.verifyNudge(this._unverified.tool);
    this._unverified = null;
    return text;
  }

  static _afterAction(prev, tool, result, ok) {
    if (!ok) return prev;
    const evidence = (result.data && result.data.evidence) || result.evidence;
    if (!evidence || !evidence.outcome) return prev;
    return evidence.outcome === 'no_change' ? { tool } : null;
  }
}

module.exports = CompletionVerifier;
