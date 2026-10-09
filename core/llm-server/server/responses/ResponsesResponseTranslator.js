const OutputItems = require('./OutputItems');
const ResponseEnvelope = require('./ResponseEnvelope');
const ResponsesIds = require('./ResponsesIds');

class ResponsesResponseTranslator {
  static translate(completion, modelId, context = {}) {
    const choice = (completion.choices && completion.choices[0]) || {};
    const envelope = new ResponseEnvelope({ id: ResponsesIds.responseId(completion.id), modelId, echo: context.echo });
    return envelope.finished({
      output: ResponsesResponseTranslator._output(choice.message || {}, context.customTools),
      usage: completion.usage,
      finishReason: choice.finish_reason,
    });
  }

  static _output(message, customTools) {
    const output = [];
    if (typeof message.reasoning_content === 'string' && message.reasoning_content) {
      output.push(OutputItems.reasoning(ResponsesIds.itemId('rs'), message.reasoning_content));
    }
    if (typeof message.content === 'string' && message.content) output.push(OutputItems.message(ResponsesIds.itemId('msg'), message.content));
    for (const call of Array.isArray(message.tool_calls) ? message.tool_calls : []) {
      output.push(ResponsesResponseTranslator._toolCall(call, customTools));
    }
    return output;
  }

  static _toolCall(call, customTools) {
    const fn = (call && call.function) || {};
    const args = typeof fn.arguments === 'string' ? fn.arguments : JSON.stringify(fn.arguments == null ? {} : fn.arguments);
    return OutputItems.toolCall({
      id: ResponsesIds.itemId('fc'),
      callId: String((call && call.id) || ResponsesIds.callId()),
      name: String(fn.name || ''),
      args,
      customTools,
    });
  }
}

module.exports = ResponsesResponseTranslator;
