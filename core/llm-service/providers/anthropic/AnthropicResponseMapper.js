class AnthropicResponseMapper {
  static STOP_REASONS = new Map([
    ['end_turn', 'stop'],
    ['stop_sequence', 'stop'],
    ['max_tokens', 'length'],
    ['tool_use', 'tool_calls'],
  ]);

  static mapStopReason(reason) {
    return AnthropicResponseMapper.STOP_REASONS.get(reason) || reason || 'stop';
  }

  static usageFrom(inputUsage, outputUsage) {
    const prompt = (inputUsage && inputUsage.input_tokens) || 0;
    const completion = (outputUsage && outputUsage.output_tokens) || 0;
    const usage = { prompt_tokens: prompt, completion_tokens: completion, total_tokens: prompt + completion };
    const thinking = outputUsage?.output_tokens_details?.thinking_tokens;
    if (typeof thinking === 'number') usage.completion_tokens_details = { reasoning_tokens: thinking };
    return usage;
  }

  static textOf(blocks) {
    return (blocks || []).filter((block) => block.type === 'text').map((block) => block.text).join('');
  }

  static thinkingOf(blocks) {
    return (blocks || []).filter((block) => block.type === 'thinking' && block.thinking).map((block) => block.thinking).join('');
  }

  static messageWithReasoning(content, reasoning, role = 'assistant') {
    return reasoning ? { role, content, reasoning_content: reasoning } : null;
  }
}

module.exports = AnthropicResponseMapper;
