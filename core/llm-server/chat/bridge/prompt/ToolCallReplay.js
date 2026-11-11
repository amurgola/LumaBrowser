const AgentLoopText = require('../../../agent/AgentLoopText');

class ToolCallReplay {
  static ACTIVATE_TOOLS = 'activate_tools';
  static MAX_CALLS_PER_TURN = 6;
  static MAX_STRING_CHARS = 240;
  static MAX_CALL_CHARS = 900;
  static TIGHT_STRING_CHARS = 60;
  static MAX_RESULT_CHARS = 300;
  static RESULT_NOTE = ' (Result of an earlier turn; its full output is no longer shown.)';

  static expand(prior, rows) {
    if (!Array.isArray(prior) || !Array.isArray(rows) || !rows.length) return prior;
    const assistants = rows.filter((r) => r && r.role === 'assistant' && r.variantActive !== false);
    let cursor = 0;
    const out = [];
    for (const message of prior) {
      if (message && message.role === 'assistant') {
        const at = assistants.findIndex((r, i) => i >= cursor && r.content === message.content);
        if (at !== -1) {
          cursor = at + 1;
          out.push(...ToolCallReplay.messagesFor(assistants[at]));
        }
      }
      out.push(message);
    }
    return out.length === prior.length ? prior : out;
  }

  static messagesFor(row) {
    const calls = ToolCallReplay._calls(row);
    const shown = calls.slice(-ToolCallReplay.MAX_CALLS_PER_TURN);
    const skipped = calls.length - shown.length;
    return shown.flatMap((call, i) => [
      { role: 'assistant', content: ToolCallReplay.fence(call) },
      { role: 'user', content: ToolCallReplay.result(call, i === 0 ? skipped : 0) },
    ]);
  }

  static fence(call) {
    let params = ToolCallReplay._clip(call.params, ToolCallReplay.MAX_STRING_CHARS);
    let json = JSON.stringify({ tool: call.tool, params });
    if (json.length > ToolCallReplay.MAX_CALL_CHARS) {
      params = ToolCallReplay._clip(call.params, ToolCallReplay.TIGHT_STRING_CHARS);
      json = JSON.stringify({ tool: call.tool, params });
    }
    return '```tool\n' + json + '\n```';
  }

  static result(call, skipped = 0) {
    const earlier = skipped > 0 ? ` (${skipped} earlier tool call${skipped === 1 ? '' : 's'} of this turn not shown.)` : '';
    return AgentLoopText.toolResult(call.tool, ToolCallReplay._outcome(call) + ToolCallReplay.RESULT_NOTE + earlier);
  }

  static _outcome(call) {
    const summary = ToolCallReplay._short(call.summary);
    if (call.status === 'err') return 'Error: ' + (ToolCallReplay._short(call.error) || 'the call failed.');
    if (call.status === 'run') return 'Not finished: the turn was stopped before this call returned.';
    return summary ? 'Done. ' + summary : 'Done.';
  }

  static _calls(row) {
    const tools = row && row.toolCalls && Array.isArray(row.toolCalls.tools) ? row.toolCalls.tools : [];
    return tools.filter((t) => t && typeof t.tool === 'string' && t.tool && t.tool !== ToolCallReplay.ACTIVATE_TOOLS
      && t.params && typeof t.params === 'object');
  }

  static _short(text) {
    const s = typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : '';
    return s.length > ToolCallReplay.MAX_RESULT_CHARS ? s.slice(0, ToolCallReplay.MAX_RESULT_CHARS) + '…' : s;
  }

  static _clip(value, max) {
    if (typeof value === 'string') {
      return value.length > max ? `${value.slice(0, max)}… [${value.length - max} more characters not repeated here]` : value;
    }
    if (Array.isArray(value)) return value.map((v) => ToolCallReplay._clip(v, max));
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, ToolCallReplay._clip(v, max)]));
    }
    return value;
  }
}

module.exports = ToolCallReplay;
