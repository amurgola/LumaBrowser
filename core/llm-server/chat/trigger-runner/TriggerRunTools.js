const TriggerFileTools = require('../triggers/TriggerFileTools');
const TriggerMemoryPolicy = require('../trigger-store/TriggerMemoryPolicy');
const SaveMemoryTool = require('./SaveMemoryTool');
const RespondToWebhookTool = require('./RespondToWebhookTool');

class TriggerRunTools {
  static build({ trigger, event = null, state, triggerStore, emitEvent = () => {} }) {
    const tools = [];
    if (trigger.kind === 'file') tools.push(...TriggerFileTools.build(trigger, event));
    const memory = TriggerMemoryPolicy.of(trigger);
    if (memory) tools.push(TriggerRunTools._saveMemory(trigger, memory, state, triggerStore, emitEvent));
    if (TriggerRunTools._respondsWithResult(trigger)) {
      tools.push(new RespondToWebhookTool((body) => { state.responseBody = body; }).definition());
    }
    return tools;
  }

  static allowList(allowedTools, extraTools) {
    if (!Array.isArray(allowedTools)) return allowedTools;
    return [...new Set([...allowedTools, ...extraTools.map((tool) => tool.name)])];
  }

  static _saveMemory(trigger, memory, state, triggerStore, emitEvent) {
    return new SaveMemoryTool({
      triggerStore,
      triggerId: trigger.id,
      maxChars: memory.maxChars,
      onSaved: () => {
        state.memorySaved = true;
        emitEvent('triggers-changed', { triggerId: trigger.id });
      },
    }).definition();
  }

  static _respondsWithResult(trigger) {
    return trigger.kind === 'webhook' && !!trigger.source && trigger.source.respond === 'result';
  }
}

module.exports = TriggerRunTools;
