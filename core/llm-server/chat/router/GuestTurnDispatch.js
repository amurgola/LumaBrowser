const ChatAssistantText = require('../ChatAssistantText');
const PlanTool = require('../plan/PlanTool');
const GuestConversationMeta = require('./GuestConversationMeta');
const AgentTurnDispatch = require('./AgentTurnDispatch');
const HostOnlyTools = require('./HostOnlyTools');

class GuestTurnDispatch {
  static CONVERSATION_ID_MAX = 120;

  constructor({ agentBridge, getAgentDeps, contextWindow }) {
    this._bridge = agentBridge;
    this._getAgentDeps = getAgentDeps;
    this._window = contextWindow;
  }

  run(turn) {
    const deps = AgentTurnDispatch.requireDeps(this._getAgentDeps);
    const persona = turn.modeSystemPrompt ? { systemPrompt: turn.modeSystemPrompt } : null;
    const meta = new GuestConversationMeta({ plan: turn.plan, mediaModels: turn.mediaModels });
    const planTool = this._planTool(turn, persona, meta);
    if (planTool) planTool.beginTurn(turn.hooks);
    const sessionTools = planTool ? [planTool.extraTool] : [];
    const tools = AgentTurnDispatch._admitting({ allowedTools: turn.allowedTools, refreshAllowedTools: null }, sessionTools);
    return this._bridge.run({
      modelRef: turn.modelRef,
      messages: turn.messages,
      temperature: turn.temperature,
      conversationId: turn.runId,
      assistantMessageId: turn.runId,
      deps,
      hooks: planTool ? planTool.watching(turn.hooks) : turn.hooks,
      priorMessages: turn.priorMessages || [],
      allowTakeover: false,
      systemRole: persona ? null : ChatAssistantText.ROLE_TOOLS,
      modeSystemPrompt: AgentTurnDispatch._promptAppend(persona, !!turn.choicesOn, !!turn.voiceOn, null, planTool, null),
      turnReminder: AgentTurnDispatch._turnReminder(!!turn.voiceOn, []),
      stepReminder: AgentTurnDispatch._stepReminder(planTool, null),
      finalCheck: planTool ? () => planTool.beforeFinalAnswer() : null,
      images: turn.images || [],
      ...tools,
      extraTools: sessionTools.length ? sessionTools : null,
      kbScope: turn.kbScope || null,
      agentBudget: AgentTurnDispatch._budget(null, null, turn.modelBudget || null),
      ctxPerSlot: this._window.forRef(turn.modelRef) || this._window.localPerSlot(),
      llmExtra: turn.extra || null,
      nativeHistory: true,
      conversationMeta: meta,
      withholdTools: HostOnlyTools.isHostOnly,
      forGuest: true,
    });
  }

  _planTool(turn, persona, meta) {
    const conversationId = GuestTurnDispatch.conversationId(turn.clientConversationId);
    if (persona || !conversationId) return null;
    return PlanTool.forTurn(meta, { convId: conversationId });
  }

  static conversationId(raw) {
    if (typeof raw !== 'string') return null;
    const id = raw.trim().slice(0, GuestTurnDispatch.CONVERSATION_ID_MAX);
    return id || null;
  }
}

module.exports = GuestTurnDispatch;
