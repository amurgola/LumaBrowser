const NarratorContext = require('../prompts/NarratorContext');
const RoleplaySamplers = require('./RoleplaySamplers');

class RoleplayModeDescriptor {
  static ID = 'roleplay';
  static TEMPERATURE = 0.9;

  static build(chat, postProcessor) {
    return {
      id: RoleplayModeDescriptor.ID,
      label: 'Roleplay',
      description: 'Scene-and-character roleplay with living characters, optional avatars and generated images.',
      requirements: ['llm'],
      chatUiUrl: chat.uiUrl('chat-ui.js'),
      buildTurn: (args) => RoleplayModeDescriptor.buildTurn(args && args.meta, args || {}),
      postProcess: (args) => postProcessor.process(args),
    };
  }

  static buildTurn(meta, { messages = [], contextWindow = null } = {}) {
    const data = (meta && meta.data) || {};
    const ctx = NarratorContext.build(data, { messages, contextWindow });
    const turn = {
      systemPrompt: ctx.systemPrompt,
      postHistoryPrompt: ctx.postHistoryPrompt,
      temperature: RoleplayModeDescriptor.TEMPERATURE,
      compact: false,
    };
    if (ctx.dropped > 0) turn.messages = ctx.messages;
    if (data.llmModel && typeof data.llmModel === 'string') turn.modelRef = data.llmModel;
    const samplers = RoleplaySamplers.forTurn(data);
    if (samplers) turn.samplers = samplers;
    return turn;
  }
}

module.exports = RoleplayModeDescriptor;
