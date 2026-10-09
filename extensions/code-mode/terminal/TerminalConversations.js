const path = require('path');

class TerminalConversations {
  static MODE_ID = 'code';

  static resumeProblem(store, id) {
    const conv = store.getConversation(id);
    if (!conv) return ['no-conversation', `conversation ${id} not found`];
    const meta = store.getMeta(id);
    if (!meta || meta.mode !== TerminalConversations.MODE_ID) return ['not-code', `conversation ${id} is not a Code session`];
    return null;
  }

  static resume(store, id, { cwd, origin, client, agent }) {
    const meta = store.getMeta(id);
    const data = { ...(meta.data || {}), kind: 'project', projectPath: cwd, origin };
    if (client) data.client = client;
    if (agent) data.agentId = agent.id;
    store.setMeta(id, { mode: TerminalConversations.MODE_ID, data });
    try { return store.listActiveMessages(id).length; } catch (_) { return 0; }
  }

  static create(store, { cwd, origin, client, agent, modelRef }) {
    const title = `${agent ? agent.name : 'Code'} · ${path.basename(cwd) || cwd}`;
    const conv = store.createConversation({ title, modelRef, toolsEnabled: true, mode: TerminalConversations.MODE_ID });
    const data = { kind: 'project', projectPath: cwd, agentId: agent ? agent.id : null, origin, task: '' };
    if (client) data.client = client;
    store.setMeta(conv.id, { mode: TerminalConversations.MODE_ID, data });
    return conv.id;
  }

  static dropIfEmpty(store, id) {
    if (!id || !store) return;
    try {
      if (store.listActiveMessages(id).length === 0) store.deleteConversation(id);
    } catch (_) {}
  }
}

module.exports = TerminalConversations;
