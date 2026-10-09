class ResponseEnvelope {
  static ECHO_DEFAULTS = { instructions: null, tools: [], tool_choice: 'auto', parallel_tool_calls: true, store: false };

  static ECHO_OPTIONAL = ['reasoning', 'temperature', 'top_p', 'max_output_tokens', 'text', 'metadata'];

  static INCOMPLETE_FINISH = 'length';

  constructor({ id, modelId, echo = {}, createdAt = Math.floor(Date.now() / 1000) }) {
    this.id = id;
    this._modelId = modelId;
    this._echo = echo || {};
    this._createdAt = createdAt;
  }

  inProgress() {
    return this._build({ status: 'in_progress', output: [], usage: null });
  }

  finished({ output, usage, finishReason }) {
    const incomplete = finishReason === ResponseEnvelope.INCOMPLETE_FINISH;
    return this._build({
      status: incomplete ? 'incomplete' : 'completed',
      incomplete_details: incomplete ? { reason: 'max_output_tokens' } : null,
      output,
      usage: ResponseEnvelope.usage(usage),
    });
  }

  failed({ output, error }) {
    return this._build({ status: 'failed', error, output, usage: null });
  }

  static echo(body) {
    const echo = {};
    for (const [key, fallback] of Object.entries(ResponseEnvelope.ECHO_DEFAULTS)) echo[key] = body[key] !== undefined ? body[key] : fallback;
    for (const key of ResponseEnvelope.ECHO_OPTIONAL) if (body[key] !== undefined) echo[key] = body[key];
    return echo;
  }

  static usage(usage) {
    const counts = usage || {};
    const input = counts.prompt_tokens || 0;
    const output = counts.completion_tokens || 0;
    return {
      input_tokens: input,
      input_tokens_details: { cached_tokens: ResponseEnvelope._detail(counts.prompt_tokens_details, 'cached_tokens') },
      output_tokens: output,
      output_tokens_details: { reasoning_tokens: ResponseEnvelope._detail(counts.completion_tokens_details, 'reasoning_tokens') },
      total_tokens: counts.total_tokens || input + output,
    };
  }

  _build(state) {
    return {
      id: this.id,
      object: 'response',
      created_at: this._createdAt,
      status: state.status,
      error: state.error || null,
      incomplete_details: state.incomplete_details || null,
      model: this._modelId,
      output: state.output,
      usage: state.usage,
      ...this._echo,
    };
  }

  static _detail(details, key) {
    return (details && details[key]) || 0;
  }
}

module.exports = ResponseEnvelope;
