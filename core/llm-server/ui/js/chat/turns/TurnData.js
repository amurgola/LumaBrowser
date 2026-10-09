export default class TurnData {
  static hasReasoning(reasoning) {
    return !!String(reasoning || '').replace(/`+/g, '').trim();
  }

  static tools(m) {
    if (m && Array.isArray(m.tools)) return m.tools;
    if (m && m.toolCalls && Array.isArray(m.toolCalls.tools)) return m.toolCalls.tools;
    return [];
  }

  static artifacts(m) {
    if (m && Array.isArray(m.artifacts) && m.artifacts.length) return m.artifacts;
    if (m && m.toolCalls && Array.isArray(m.toolCalls.artifacts)) return m.toolCalls.artifacts;
    return [];
  }

  static agentRuns(m) {
    return (m && Array.isArray(m.agentRuns)) ? m.agentRuns : [];
  }

  static imageArtifacts(m) {
    return TurnData.artifacts(m).filter((a) => a && (a.type || '') === 'image');
  }
}
