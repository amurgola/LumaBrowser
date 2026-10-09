const ToolCallSniffer = require('../parsing/ToolCallSniffer');
const ToolFenceStripper = require('../parsing/ToolFenceStripper');
const FallbackMessage = require('./FallbackMessage');

class FinalTextResolver {
  static SNIPPET_CHARS = 800;
  static BIG_PAYLOAD_CHARS = 1500;
  static MALFORMED_ERROR = 'Tool call was malformed or cut off before it finished (often a too-long payload).';
  static LEAKED_ERROR = 'A follow-up tool call had invalid JSON and was not run.';
  static DONE_WITH_FAILED_TWEAK = 'Done: the result is shown above. (I tried a follow-up tweak but its tool call didn\'t come out as valid JSON; ask me to adjust it and I\'ll redo that cleanly.)';

  static resolve({ result, trace, artifacts, groups, hooks }) {
    const text = result.finalResponse || FallbackMessage.compose(result, trace.entries);
    if (trace.length === 0 && ToolCallSniffer.looksLikeAttempt(text)) {
      return FinalTextResolver._recoverMalformed(text, trace, groups, hooks);
    }
    return FinalTextResolver._stripLeaked(text, { result, trace, artifacts, hooks });
  }

  static _recoverMalformed(text, trace, groups, hooks) {
    const raw = String(text).trim();
    const intended = ToolCallSniffer.attemptedToolName(text);
    const group = intended ? groups.groupFor(intended) : null;
    let loadedNote = '';
    if (group && !groups.active.has(group)) {
      groups.activate([group]);
      loadedNote = ` I've loaded the **${intended}** instructions; ask once more and I'll build it correctly.`;
    }
    FinalTextResolver._recordFailure(trace, hooks, intended, FinalTextResolver.MALFORMED_ERROR);
    const opener = raw.length >= FinalTextResolver.BIG_PAYLOAD_CHARS
      ? 'I started building that, but my tool call had too much inline content and the JSON didn\'t come out valid.'
      : 'I tried to call a tool but emitted JSON the agent couldn\'t parse.';
    return opener
      + loadedNote
      + (loadedNote ? '' : ' Could you ask again? If this keeps happening, the model may be drifting from the required tool-call format.')
      + '\n\nWhat I emitted:\n\n````\n' + raw.slice(0, FinalTextResolver.SNIPPET_CHARS)
      + (raw.length > FinalTextResolver.SNIPPET_CHARS ? '\n…' : '') + '\n````';
  }

  static _stripLeaked(text, { result, trace, artifacts, hooks }) {
    const stripped = ToolFenceStripper.stripLeaked(text);
    if (stripped.removed <= 0) return text;
    FinalTextResolver._recordFailure(trace, hooks, ToolCallSniffer.attemptedToolName(text), FinalTextResolver.LEAKED_ERROR);
    if (stripped.text) return stripped.text;
    return artifacts.length ? FinalTextResolver.DONE_WITH_FAILED_TWEAK : FallbackMessage.compose(result, trace.entries);
  }

  static _recordFailure(trace, hooks, intended, error) {
    const tool = intended || 'unknown';
    trace.addFailure(tool, error);
    if (!hooks.onToolEvent) return;
    hooks.onToolEvent({ phase: 'run', tool, params: null });
    hooks.onToolEvent({ phase: 'done', tool, success: false, error: 'Parse failed' });
  }
}

module.exports = FinalTextResolver;
