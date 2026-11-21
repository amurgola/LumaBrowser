class CallToolCall {
  static NAME = 'call_tool';

  static REFUSAL = Object.freeze({
    success: false,
    error: 'call_tool needs "name" (the tool to run) and "params" (that tool\'s parameters as an object).',
  });

  static unwrap(call) {
    if (!call || call.tool !== CallToolCall.NAME) return call;
    const outer = call.params && typeof call.params === 'object' ? call.params : {};
    const name = typeof outer.name === 'string' ? outer.name.trim() : '';
    if (!name || name === CallToolCall.NAME) return call;
    return { ...call, tool: name, params: CallToolCall._innerParams(outer) };
  }

  static streamed(name, args) {
    if (name !== CallToolCall.NAME) return { name, args };
    const text = String(args || '');
    const named = /"name"\s*:\s*"([^"\\]+)"/.exec(text);
    const params = /"(?:params|arguments|args)"\s*:\s*/.exec(text);
    return { name: named ? named[1] : null, args: params ? text.slice(params.index + params[0].length) : '' };
  }

  static _innerParams(outer) {
    const given = [outer.params, outer.arguments, outer.args].find((value) => value != null);
    const parsed = typeof given === 'string' ? CallToolCall._parsed(given) : given;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  }

  static _parsed(text) {
    try {
      return JSON.parse(text);
    } catch (_) {
      return null;
    }
  }
}

module.exports = CallToolCall;
