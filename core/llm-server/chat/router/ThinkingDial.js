const ThinkingOff = require('../../../llm-service/ThinkingOff');
const ReasoningEffort = require('../../../shared/llm/ReasoningEffort');

class ThinkingDial {
  constructor({ llmServerService, chatStore, peers = null }) {
    this._service = llmServerService;
    this._store = chatStore;
    this._peers = peers;
  }

  resolve(turn) {
    const { extra, messages } = this._resolveDial(turn);
    return { messages, plainExtra: extra, agentExtra: this._agentExtra(turn, extra) };
  }

  _resolveDial(turn) {
    try {
      const dial = this._dialPosition(turn);
      if (dial !== 'off') return { extra: ReasoningEffort.extraFor(dial), messages: turn.messages };
      return this._thinkingOff(turn);
    } catch (_) {
      return { extra: null, messages: turn.messages };
    }
  }

  _dialPosition(turn) {
    if (turn.noThink === true) return 'off';
    const defaults = this._service.getDefaults();
    const conv = turn.conversationId && this._store ? this._store.getConversation(turn.conversationId) : null;
    return ReasoningEffort.resolveDial({
      turn: turn.reasoningEffort,
      conversation: conv ? conv.reasoningEffort : null,
      model: turn.modelEffort,
      fallback: this._hostDecides(turn.modelRef) ? null : (defaults.noThink ? 'off' : defaults.reasoningEffort),
    });
  }

  _hostDecides(modelRef) {
    try { return !!(this._peers && this._peers.is(modelRef)); } catch (_) { return false; }
  }

  _thinkingOff(turn) {
    const facts = (this._service.getRunningThinking && this._service.getRunningThinking()) || null;
    const resolved = ThinkingOff.resolve(turn.modelRef, turn.messages, facts);
    return { extra: resolved.extra, messages: turn.noThink === true ? resolved.messages : turn.messages };
  }

  _agentExtra(turn, extra) {
    if (!(turn.agentMode && extra === null && turn.noThink !== true)) return extra;
    const chosen = turn.evalOverrides && turn.evalOverrides.agentEffort;
    if (!chosen && this._hostDecides(turn.modelRef)) return { agentTurn: true };
    return ReasoningEffort.extraFor(chosen || ReasoningEffort.AGENT_DEFAULT);
  }
}

module.exports = ThinkingDial;
