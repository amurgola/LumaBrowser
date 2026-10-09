class StopReason {
  static forFinish(finishReason) {
    switch (finishReason) {
      case 'tool_calls': case 'function_call': return 'tool_use';
      case 'length': return 'max_tokens';
      default: return 'end_turn';
    }
  }

  static forReply(finishReason, hasToolCalls) {
    if (hasToolCalls && finishReason !== 'length') return 'tool_use';
    return StopReason.forFinish(finishReason);
  }
}

module.exports = StopReason;
