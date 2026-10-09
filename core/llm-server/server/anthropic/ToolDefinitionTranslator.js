class ToolDefinitionTranslator {
  static CHOICES = { auto: 'auto', any: 'required', none: 'none' };

  static apply(body, out) {
    const tools = ToolDefinitionTranslator.functions(body.tools);
    if (!tools.length) return;
    out.tools = tools;
    ToolDefinitionTranslator._applyChoice(body.tool_choice, out);
  }

  static functions(tools) {
    if (!Array.isArray(tools)) return [];
    return tools.filter((tool) => ToolDefinitionTranslator._isCustom(tool)).map((tool) => ToolDefinitionTranslator._function(tool));
  }

  static _isCustom(tool) {
    return !!tool && typeof tool === 'object' && typeof tool.name === 'string' && (tool.type == null || tool.type === 'custom');
  }

  static _function(tool) {
    return {
      type: 'function',
      function: {
        name: tool.name,
        description: typeof tool.description === 'string' ? tool.description : '',
        parameters: tool.input_schema && typeof tool.input_schema === 'object' ? tool.input_schema : { type: 'object', properties: {} },
      },
    };
  }

  static _applyChoice(choice, out) {
    if (!choice || typeof choice !== 'object') return;
    const mapped = ToolDefinitionTranslator._choice(choice);
    if (mapped) out.tool_choice = mapped;
    if (choice.disable_parallel_tool_use === true) out.parallel_tool_calls = false;
  }

  static _choice(choice) {
    if (choice.type === 'tool') return choice.name ? { type: 'function', function: { name: choice.name } } : null;
    const choices = ToolDefinitionTranslator.CHOICES;
    return Object.prototype.hasOwnProperty.call(choices, choice.type) ? choices[choice.type] : null;
  }
}

module.exports = ToolDefinitionTranslator;
