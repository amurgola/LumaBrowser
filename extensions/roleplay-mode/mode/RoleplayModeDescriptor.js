const NarratorPrompt = require('../prompts/NarratorPrompt');

class RoleplayModeDescriptor {
  static ID = 'roleplay';
  static TEMPERATURE = 0.9;

  static build(chat, postProcessor) {
    return {
      id: RoleplayModeDescriptor.ID,
      label: 'Roleplay',
      description: 'Scene-and-character roleplay with avatars and generated images.',
      requirements: ['llm', 'image'],
      chatUiUrl: chat.uiUrl('chat-ui.js'),
      buildTurn: ({ meta }) => RoleplayModeDescriptor.buildTurn(meta),
      postProcess: (args) => postProcessor.process(args),
    };
  }

  static buildTurn(meta) {
    const data = (meta && meta.data) || {};
    const turn = { systemPrompt: NarratorPrompt.build(data), temperature: RoleplayModeDescriptor.TEMPERATURE };
    if (data.llmModel && typeof data.llmModel === 'string') turn.modelRef = data.llmModel;
    return turn;
  }
}

module.exports = RoleplayModeDescriptor;
