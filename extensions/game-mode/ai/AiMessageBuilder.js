class AiMessageBuilder {
  static MAX_MESSAGES = 60;
  static MAX_HISTORY_CHARS = 32000;

  static build({ game = {}, req = {} }) {
    const parts = [
      AiMessageBuilder._engineLine(game),
      AiMessageBuilder._tagged('game_premise', game.premise),
      AiMessageBuilder._tagged('world', game.worldNotes),
      AiMessageBuilder._tagged('instructions', req.system),
      AiMessageBuilder._protocol(req),
    ].filter(Boolean);
    const history = AiMessageBuilder.trimHistory(Array.isArray(req.messages) ? req.messages : []);
    return [{ role: 'system', content: parts.join('\n\n') }, ...history];
  }

  static trimHistory(messages) {
    let out = AiMessageBuilder._cleanTurns(messages).slice(-AiMessageBuilder.MAX_MESSAGES);
    let chars = out.reduce((n, m) => n + m.content.length, 0);
    while (out.length > 1 && chars > AiMessageBuilder.MAX_HISTORY_CHARS) {
      chars -= out[0].content.length;
      out = out.slice(1);
    }
    if (out.length && out[out.length - 1].role === 'assistant') out.push({ role: 'user', content: 'Continue.' });
    if (!out.length) out.push({ role: 'user', content: 'Begin.' });
    return out;
  }

  static toolProtocol(tools, json) {
    const lines = tools.map((t) => {
      const schema = t.parameters && typeof t.parameters === 'object' ? JSON.stringify(t.parameters) : '{}';
      return `- ${t.name}: ${String(t.description || '').trim() || '(no description)'}\n  args schema: ${schema}`;
    });
    const finalShape = json ? '{"final": { ...the requested JSON object... }}' : '{"final": "your answer text"}';
    return `<game_functions>
You may call these game functions to look things up or make things happen before you answer.
To call one, reply with ONLY this JSON object and nothing else:
{"tool": "<function name>", "args": { ...arguments matching the schema... }}
Available functions:
${lines.join('\n')}
You will receive the result, then continue. When you have what you need, reply with ONLY:
${finalShape}
Exactly one JSON object per reply. Never call a function you do not need. Never invent function names.
</game_functions>`;
  }

  static jsonProtocol(json) {
    const hint = typeof json === 'string' && json.trim() ? `\nThe object must have this shape:\n${json.trim()}` : '';
    return `<output_format>
Reply with ONLY one JSON object: no prose before or after it, no markdown fences.${hint}
</output_format>`;
  }

  static _engineLine(game) {
    const name = String(game.name || 'the game').trim();
    return `You are the AI engine inside the game "${name}". The game's code is calling you for dialogue, `
      + 'generated content, or decisions. Follow the instructions below exactly and output ONLY what is '
      + 'asked for: no preamble, no commentary, no markdown unless asked.';
  }

  static _tagged(tag, value) {
    const text = value ? String(value).trim() : '';
    return text ? `<${tag}>\n${text}\n</${tag}>` : '';
  }

  static _protocol(req) {
    const tools = Array.isArray(req.tools) ? req.tools : [];
    if (tools.length) return AiMessageBuilder.toolProtocol(tools, !!req.json);
    if (req.json) return AiMessageBuilder.jsonProtocol(req.json);
    return '<output_format>\nReply in plain prose: the words themselves, not JSON, not a key/value object, no markdown fences.\n</output_format>';
  }

  static _cleanTurns(messages) {
    const clean = [];
    for (const m of messages) {
      if (!m || typeof m !== 'object') continue;
      const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content == null ? '' : m.content);
      if (!content.trim()) continue;
      clean.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content });
    }
    return clean;
  }
}

module.exports = AiMessageBuilder;
