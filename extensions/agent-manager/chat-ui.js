import AgentChatClient from './ui/AgentChatClient.js';

if (window.LumaChatExt && typeof window.LumaChatExt.registerMode === 'function') {
  window.LumaChatExt.registerMode(AgentChatClient.mode());
}
