const ResponsesContent = require('./ResponsesContent');

class ResponseInputTranslator {
  static SYSTEM_ROLES = ['system', 'developer'];

  static translate(input) {
    if (typeof input === 'string') return { system: [], messages: input ? [{ role: 'user', content: input }] : [] };
    const translator = new ResponseInputTranslator();
    for (const item of Array.isArray(input) ? input : []) translator._add(item);
    return translator._result();
  }

  constructor() {
    this._system = [];
    this._messages = [];
    this._turn = null;
  }

  _add(item) {
    if (!item || typeof item !== 'object') return;
    switch (item.type || (item.role ? 'message' : null)) {
      case 'message': this._message(item); break;
      case 'reasoning': this._reasoning(item); break;
      case 'function_call': this._toolCall(item.call_id, item.name, ResponseInputTranslator._arguments(item.arguments)); break;
      case 'custom_tool_call': this._toolCall(item.call_id, item.name, JSON.stringify({ input: String(item.input || '') })); break;
      case 'local_shell_call': this._toolCall(item.call_id, 'local_shell', JSON.stringify(item.action || {})); break;
      case 'function_call_output': case 'custom_tool_call_output': this._toolOutput(item); break;
      default: break;
    }
  }

  _message(item) {
    if (ResponseInputTranslator.SYSTEM_ROLES.includes(item.role)) {
      const text = ResponsesContent.text(item.content);
      if (text) this._system.push(text);
    } else if (item.role === 'assistant') {
      this._assistantText(ResponsesContent.text(item.content, ''));
    } else {
      this._push({ role: 'user', content: ResponsesContent.userContent(item.content) });
    }
  }

  _reasoning(item) {
    const text = ResponsesContent.text(item.content, '') || ResponsesContent.text(item.summary, '\n');
    if (this._turn && (this._turn.text || this._turn.toolCalls.length)) this._flush();
    this._openTurn().reasoning += text;
  }

  _assistantText(text) {
    if (this._turn && this._turn.toolCalls.length) this._flush();
    this._openTurn().text += text;
  }

  _toolCall(callId, name, args) {
    this._openTurn().toolCalls.push({ id: String(callId || ''), type: 'function', function: { name: String(name || ''), arguments: args } });
  }

  _toolOutput(item) {
    this._push({ role: 'tool', tool_call_id: String(item.call_id || ''), content: ResponsesContent.toolOutput(item.output) });
  }

  _openTurn() {
    if (!this._turn) this._turn = { text: '', reasoning: '', toolCalls: [] };
    return this._turn;
  }

  _push(message) {
    this._flush();
    this._messages.push(message);
  }

  _flush() {
    const turn = this._turn;
    this._turn = null;
    if (!turn || (!turn.text && !turn.toolCalls.length)) return;
    const message = { role: 'assistant', content: turn.text || (turn.toolCalls.length ? null : '') };
    if (turn.toolCalls.length) message.tool_calls = turn.toolCalls;
    if (turn.reasoning) message.reasoning_content = turn.reasoning;
    this._messages.push(message);
  }

  _result() {
    this._flush();
    return { system: this._system, messages: this._messages };
  }

  static _arguments(raw) {
    if (typeof raw === 'string') return raw;
    return JSON.stringify(raw == null ? {} : raw);
  }
}

module.exports = ResponseInputTranslator;
