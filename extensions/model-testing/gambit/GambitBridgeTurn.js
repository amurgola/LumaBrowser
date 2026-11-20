class GambitBridgeTurn {
  static create({ bridge, deps, modelRef = null, nativeHistory = false, nativeTools = null, agentEffort = null, parallel = null, promptExperiments = null }) {
    if (!bridge || typeof bridge.runForEval !== 'function') {
      throw new Error('makeGambitRunTurn: an AgentChatBridge with runForEval is required');
    }
    const settings = { deps, modelRef, nativeHistory, nativeTools, agentEffort, parallel, promptExperiments };
    return ({ task, prompt, priorMessages, timeoutMs }) => bridge.runForEval({
      task,
      prompt,
      priorMessages,
      conversationId: GambitBridgeTurn.conversationIdFor(task),
      timeoutMs,
      ...settings,
    });
  }

  static conversationIdFor(task) {
    return `gambit-${task.id}`;
  }
}

module.exports = GambitBridgeTurn;
