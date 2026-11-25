const GuestTurnDispatch = require('../../../llm-server/chat/router/GuestTurnDispatch');
const ImageModelPicks = require('../../../image-server/router/ImageModelPicks');

class WebChatTurnFlags {
  static CONVERSATION_ID = 'luma_conversation_id';
  static PLAN = 'luma_plan';
  static CHOICES = 'luma_choices';
  static VOICE = 'luma_voice';
  static DISABLED_TOOLS = 'luma_disabled_tools';
  static MEDIA_MODELS = 'luma_media_models';

  static of(body) {
    const b = body || {};
    const clientConversationId = GuestTurnDispatch.conversationId(b[WebChatTurnFlags.CONVERSATION_ID]);
    return {
      isWebChat: !!clientConversationId,
      clientConversationId,
      plan: b[WebChatTurnFlags.PLAN] && typeof b[WebChatTurnFlags.PLAN] === 'object' ? b[WebChatTurnFlags.PLAN] : null,
      mediaModels: ImageModelPicks.normalize(b[WebChatTurnFlags.MEDIA_MODELS]),
      choicesOn: b[WebChatTurnFlags.CHOICES] === true,
      voiceOn: b[WebChatTurnFlags.VOICE] === true,
      disabledTools: Array.isArray(b[WebChatTurnFlags.DISABLED_TOOLS]) ? b[WebChatTurnFlags.DISABLED_TOOLS].filter((name) => typeof name === 'string') : [],
    };
  }

  static narrow(allowedTools, disabledTools) {
    if (!Array.isArray(allowedTools) || !disabledTools.length) return allowedTools;
    const off = new Set(disabledTools);
    return allowedTools.filter((name) => !off.has(name));
  }
}

module.exports = WebChatTurnFlags;
