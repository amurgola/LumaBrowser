class ChatTurnInputs {
  static images(attachments) {
    return (Array.isArray(attachments) ? attachments : [])
      .filter((attachment) => attachment && attachment.kind === 'image' && attachment.base64)
      .map((attachment) => ({ name: attachment.name, mime: attachment.mime || 'image/png', base64: attachment.base64 }));
  }

  static wantsAgent(body, agentTurn) {
    if (agentTurn) return !!agentTurn.agent;
    return body.agent === true || body.tools === true;
  }

  static allowedTools(agentTurn, hostAllowList) {
    if (!agentTurn || !Array.isArray(agentTurn.allowedTools)) return hostAllowList;
    if (!hostAllowList) return agentTurn.allowedTools;
    return agentTurn.allowedTools.filter((tool) => hostAllowList.includes(tool));
  }

  static streamMessages(agentTurn, wantAgent, messages) {
    if (!agentTurn || !agentTurn.systemPrompt || wantAgent) return messages;
    return [{ role: 'system', content: String(agentTurn.systemPrompt) }, ...messages];
  }
}

module.exports = ChatTurnInputs;
