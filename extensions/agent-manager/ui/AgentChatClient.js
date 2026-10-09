import AgentDirectory from './AgentDirectory.js';
import AgentPicker from './AgentPicker.js';

export default class AgentChatClient {
  static MODE_ID = 'agent-chat';

  static mode() {
    return {
      id: AgentChatClient.MODE_ID,
      openSetup: (api) => AgentChatClient.openSetup(api),
      decorateComposer: (els, ctx) => AgentChatClient.decorateComposer(els, ctx),
    };
  }

  static async openSetup(api) {
    const agents = await AgentDirectory.list(api);
    if (!agents.length) return null;
    const a = await AgentPicker.pick(agents);
    return a ? { agentId: a.id, agentName: a.name } : null;
  }

  static decorateComposer(els, ctx) {
    const name = ctx && ctx.meta && ctx.meta.data && ctx.meta.data.agentName;
    if (els && els.textarea && name) els.textarea.placeholder = 'Message ' + name + '…';
  }
}
