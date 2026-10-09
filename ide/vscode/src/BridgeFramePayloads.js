'use strict';

const SessionStatus = require('./SessionStatus');

class BridgeFramePayloads {
  static readyState(p, { root, approval }) {
    return {
      status: SessionStatus.READY,
      statusMessage: '',
      conversationId: typeof p.conversationId === 'string' ? p.conversationId : null,
      agent: p.agent && p.agent.id ? { id: String(p.agent.id), name: String(p.agent.name || p.agent.id) } : null,
      model: typeof p.model === 'string' ? p.model : null,
      root: typeof p.root === 'string' ? p.root : root,
      resumedMessages: Number.isInteger(p.resumedMessages) ? p.resumedMessages : 0,
      approval: typeof p.approval === 'string' ? p.approval : approval,
    };
  }

  static agentRows(p) {
    return (Array.isArray(p.agents) ? p.agents : [])
      .filter((a) => a && a.id && a.name)
      .map((a) => ({
        id: String(a.id),
        name: String(a.name),
        description: a.description ? String(a.description) : '',
        model: a.model ? String(a.model) : null,
        tools: Number(a.tools) || 0,
      }));
  }
}

module.exports = BridgeFramePayloads;
