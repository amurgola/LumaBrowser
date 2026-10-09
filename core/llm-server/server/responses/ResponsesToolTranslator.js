class ResponsesToolTranslator {
  static CHOICES = ['auto', 'none', 'required'];

  static CUSTOM_INPUT_HINT = 'Put the complete raw input in the `input` string.';

  static apply(body, out) {
    const result = { customTools: new Set(), dropped: [] };
    const tools = (Array.isArray(body.tools) ? body.tools : []).map((tool) => ResponsesToolTranslator._tool(tool, result)).filter(Boolean);
    if (!tools.length) return result;
    out.tools = tools;
    ResponsesToolTranslator._applyChoice(body.tool_choice, out);
    if (typeof body.parallel_tool_calls === 'boolean') out.parallel_tool_calls = body.parallel_tool_calls;
    return result;
  }

  static _tool(tool, result) {
    if (!tool || typeof tool !== 'object') return null;
    if (tool.type === 'function' && typeof tool.name === 'string') return ResponsesToolTranslator._function(tool);
    if (tool.type === 'custom' && typeof tool.name === 'string') {
      result.customTools.add(tool.name);
      return ResponsesToolTranslator._custom(tool);
    }
    result.dropped.push(String(tool.type || 'unknown'));
    return null;
  }

  static _function(tool) {
    const fn = {
      name: tool.name,
      description: typeof tool.description === 'string' ? tool.description : '',
      parameters: tool.parameters && typeof tool.parameters === 'object' ? tool.parameters : { type: 'object', properties: {} },
    };
    if (typeof tool.strict === 'boolean') fn.strict = tool.strict;
    return { type: 'function', function: fn };
  }

  static _custom(tool) {
    return {
      type: 'function',
      function: {
        name: tool.name,
        description: ResponsesToolTranslator._customDescription(tool),
        parameters: { type: 'object', properties: { input: { type: 'string' } }, required: ['input'], additionalProperties: false },
      },
    };
  }

  static _customDescription(tool) {
    const parts = [typeof tool.description === 'string' ? tool.description : '', ResponsesToolTranslator.CUSTOM_INPUT_HINT];
    const format = tool.format;
    if (format && format.type === 'grammar' && typeof format.definition === 'string') {
      const syntax = format.syntax ? `${format.syntax} ` : '';
      parts.push(`The input must match this ${syntax}grammar:\n${format.definition}`);
    }
    return parts.filter(Boolean).join('\n\n');
  }

  static _applyChoice(choice, out) {
    if (typeof choice === 'string') {
      if (ResponsesToolTranslator.CHOICES.includes(choice)) out.tool_choice = choice;
      return;
    }
    if (choice && (choice.type === 'function' || choice.type === 'custom') && choice.name) {
      out.tool_choice = { type: 'function', function: { name: choice.name } };
    }
  }
}

module.exports = ResponsesToolTranslator;
