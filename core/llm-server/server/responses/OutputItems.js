class OutputItems {
  static COMPLETED = 'completed';

  static IN_PROGRESS = 'in_progress';

  static message(id, text, status = OutputItems.COMPLETED) {
    const content = status === OutputItems.IN_PROGRESS ? [] : [OutputItems.textPart(text)];
    return { type: 'message', id, status, role: 'assistant', content };
  }

  static textPart(text) {
    return { type: 'output_text', text: String(text || ''), annotations: [] };
  }

  static reasoning(id, text) {
    return { type: 'reasoning', id, summary: [], content: text ? [OutputItems.reasoningPart(text)] : [] };
  }

  static reasoningPart(text) {
    return { type: 'reasoning_text', text: String(text || '') };
  }

  static toolCall({ id, callId, name, args, customTools, status = OutputItems.COMPLETED }) {
    if (customTools && customTools.has(name)) {
      return { type: 'custom_tool_call', id, call_id: callId, name, input: OutputItems.customInput(args), status };
    }
    return { type: 'function_call', id, call_id: callId, name, arguments: String(args || ''), status };
  }

  static customInput(args) {
    try {
      const parsed = JSON.parse(args);
      return parsed && typeof parsed.input === 'string' ? parsed.input : String(args || '');
    } catch (_) {
      return String(args || '');
    }
  }
}

module.exports = OutputItems;
