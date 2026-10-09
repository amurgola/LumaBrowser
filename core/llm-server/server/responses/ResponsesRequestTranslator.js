const ResponseEnvelope = require('./ResponseEnvelope');
const ResponseInputTranslator = require('./ResponseInputTranslator');
const ResponsesToolTranslator = require('./ResponsesToolTranslator');

class ResponsesRequestTranslator {
  static NO_STORED_RESPONSES = 'previous_response_id is not supported: this server stores no responses, so send the whole conversation in input (store: false).';

  static EFFORTS = { minimal: 'low', low: 'low', medium: 'medium', high: 'high', xhigh: 'xhigh' };

  static translate(body, modelId) {
    if (body.previous_response_id) return { error: ResponsesRequestTranslator.NO_STORED_RESPONSES, param: 'previous_response_id' };
    const input = ResponseInputTranslator.translate(body.input);
    if (!input.messages.length) return { error: 'input is required', param: 'input' };
    const out = { model: modelId, messages: ResponsesRequestTranslator._messages(body.instructions, input) };
    const tools = ResponsesToolTranslator.apply(body, out);
    ResponsesRequestTranslator._applySampling(body, out);
    ResponsesRequestTranslator._applyReasoning(body.reasoning, out);
    ResponsesRequestTranslator._applyTextFormat(body.text, out);
    ResponsesRequestTranslator._applyStream(body, out);
    return { body: out, context: { customTools: tools.customTools, echo: ResponseEnvelope.echo(body) }, dropped: tools.dropped };
  }

  static _messages(instructions, input) {
    const system = [typeof instructions === 'string' ? instructions : '', ...input.system].filter(Boolean).join('\n\n');
    return system ? [{ role: 'system', content: system }, ...input.messages] : input.messages;
  }

  static _applySampling(body, out) {
    if (Number.isFinite(body.max_output_tokens)) out.max_tokens = Math.max(1, Math.floor(body.max_output_tokens));
    for (const key of ['temperature', 'top_p']) {
      if (typeof body[key] === 'number') out[key] = body[key];
    }
  }

  static _applyReasoning(reasoning, out) {
    const effort = reasoning && typeof reasoning === 'object' ? reasoning.effort : null;
    if (effort === 'none') out.enable_thinking = false;
    else if (ResponsesRequestTranslator.EFFORTS[effort]) out.reasoning_effort = ResponsesRequestTranslator.EFFORTS[effort];
  }

  static _applyTextFormat(text, out) {
    const format = text && typeof text === 'object' ? text.format : null;
    if (!format || typeof format !== 'object') return;
    if (format.type === 'json_object') out.response_format = { type: 'json_object' };
    if (format.type === 'json_schema' && format.schema) {
      out.response_format = { type: 'json_schema', json_schema: { name: format.name || 'output', schema: format.schema, strict: format.strict === true } };
    }
  }

  static _applyStream(body, out) {
    if (body.stream !== true) return;
    out.stream = true;
    out.stream_options = { include_usage: true };
  }
}

module.exports = ResponsesRequestTranslator;
