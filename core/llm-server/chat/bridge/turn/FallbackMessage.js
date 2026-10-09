class FallbackMessage {
  static TOOL_FAILED = "I wasn't able to finish that: a tool step failed and I couldn't recover.";
  static MIN_PROSE_CHARS = 8;
  static MAX_ERROR_CHARS = 140;

  static compose(result, toolTrace) {
    const prose = FallbackMessage._lastProse(result);
    let msg = prose && prose.length > FallbackMessage.MIN_PROSE_CHARS ? prose : FallbackMessage._nothingToShow(toolTrace);
    const lines = (toolTrace || []).map(FallbackMessage._stepLine);
    if (lines.length) msg += `\n\n**Steps I took:**\n${lines.join('\n')}`;
    return msg;
  }

  static _lastProse(result) {
    const steps = result && Array.isArray(result.steps) ? result.steps : [];
    const last = steps.slice().reverse().map((s) => s && s.assistantContent).find(Boolean);
    return last ? String(last).replace(/```[\s\S]*?```/g, '').replace(/\s+\n/g, '\n').trim() : '';
  }

  static _nothingToShow(toolTrace) {
    if (toolTrace && toolTrace.some((t) => t.status === 'err')) return FallbackMessage.TOOL_FAILED;
    const toolsRan = Array.isArray(toolTrace) && toolTrace.length > 0;
    return `I wasn't able to finish that: the model kept returning an empty reply${toolsRan ? ' after the steps below' : ''}, so there's nothing to show. Ask me to try again.`;
  }

  static _stepLine(t) {
    const mark = t.status === 'ok' ? '[ok]' : t.status === 'err' ? '[error]' : '[pending]';
    return `- ${mark} ${t.tool}${t.error ? `: ${String(t.error).slice(0, FallbackMessage.MAX_ERROR_CHARS)}` : ''}`;
  }
}

module.exports = FallbackMessage;
