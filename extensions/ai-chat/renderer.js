import AiChatRenderer from './ui/AiChatRenderer.js';

const instance = new AiChatRenderer();

window.__ext_ai_chat = {
  activate: (context) => instance.activate(context),
};
