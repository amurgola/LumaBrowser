const GameTool = require('./GameTool');

class TestAiPromptTool extends GameTool {
  constructor(scope, { bridge, framing }) {
    super(scope);
    this._bridge = bridge;
    this._framing = framing;
  }

  get name() { return 'test_ai_prompt'; }

  get sandboxed() { return true; }

  get description() {
    return 'Try an in-game AI call exactly as the running game would make it (same framing, model, and '
      + 'reply parsing as AI.ask). Use it to tune a prompt, a JSON shape, or a tool set BEFORE wiring it '
      + 'into code: pass the system instructions, the player-facing prompt, optionally a json shape and '
      + 'tool definitions, and read back what the model actually returns.';
  }

  get inputSchema() {
    return {
      type: 'object',
      properties: {
        system: { type: 'string', description: 'The system/instructions text the game will pass' },
        prompt: { type: 'string', description: 'The user-turn prompt the game will pass' },
        json: { type: 'string', description: 'Optional: the JSON shape the reply must follow (forces JSON output)' },
        tools: {
          type: 'array',
          description: 'Optional: tool definitions [{name, description, parameters}] the game would declare',
          items: { type: 'object' },
        },
        history: {
          type: 'array',
          description: 'Optional prior turns [{role:"user"|"assistant", content}]',
          items: { type: 'object' },
        },
        temperature: { type: 'number' },
        think: { type: 'boolean', description: 'Allow model reasoning (slower, better for generation). Default false.' },
      },
      required: ['prompt'],
    };
  }

  async run(params = {}) {
    const started = Date.now();
    const r = await this._bridge.complete(this._scope.conversationId, TestAiPromptTool._request(params), { game: this._framing() });
    return TestAiPromptTool._result(r, Date.now() - started);
  }

  static _request(params) {
    const history = Array.isArray(params.history) ? params.history : [];
    return {
      system: params.system,
      messages: [...history, { role: 'user', content: String(params.prompt || '') }],
      json: params.json ? String(params.json) : false,
      tools: params.tools,
      temperature: params.temperature,
      think: !!params.think,
    };
  }

  static _result(r, ms) {
    if (!r.success) {
      return {
        success: true,
        message: `The call FAILED after ${ms}ms: ${r.error}${r.raw ? `\nRaw reply:\n${r.raw}` : ''}\n`
          + 'Simplify the instructions or the JSON shape and try again.',
        summary: `test_ai_prompt · failed · ${ms}ms`,
      };
    }
    if (r.kind === 'tool') {
      return {
        success: true,
        message: `In ${ms}ms the model chose to CALL TOOL ${r.name} with args ${JSON.stringify(r.args)}. `
          + 'At play time the runtime would run your handler and continue the loop. '
          + `Raw reply:\n${r.raw}`,
        summary: `test_ai_prompt · tool ${r.name} · ${ms}ms`,
      };
    }
    const isJson = r.value !== undefined;
    return {
      success: true,
      message: `Reply in ${ms}ms${isJson ? ' (valid JSON)' : ''}:\n${isJson ? JSON.stringify(r.value, null, 2) : r.text}`,
      summary: `test_ai_prompt · ${isJson ? 'json' : 'text'} · ${ms}ms`,
    };
  }
}

module.exports = TestAiPromptTool;
