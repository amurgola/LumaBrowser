export default class TurnFlags {
  static build(state, voice) {
    return {
      agent: state.toolsOn,
      tools: state.toolsOn,
      disabledTools: state.disabledTools,
      choicesEnabled: state.choicesEnabled !== false && !voice,
      noThink: voice || undefined,
      reasoningEffort: state.reasoningEffort || undefined,
      voice: voice || undefined,
      docsSource: state.docsSource === true,
    };
  }

  static context(messages) {
    return messages
      .filter((m) => m.content || m.role === 'user')
      .map((m) => ({ role: m.role, content: m.content }));
  }
}
