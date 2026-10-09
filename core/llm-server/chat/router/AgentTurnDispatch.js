const ChatStyleDocs = require('./ChatStyleDocs');
const DocsSourceGrant = require('./DocsSourceGrant');

class AgentTurnDispatch {
  static NOT_READY = 'Tools aren’t ready yet: the browser is still starting up. Try again in a moment.';

  constructor({ agentBridge, chatStore, getAgentDeps, policy, contextWindow }) {
    this._bridge = agentBridge;
    this._store = chatStore;
    this._getAgentDeps = getAgentDeps;
    this._policy = policy;
    this._window = contextWindow;
  }

  run(turn) {
    const deps = AgentTurnDispatch.requireDeps(this._getAgentDeps);
    const t = AgentTurnDispatch._withDefaults(turn);
    const tools = AgentTurnDispatch._withDocs(this._toolAccess(t.modeTurn, t.evalOverrides, t.convId, deps), t.docsGrant);
    return this._bridge.run({
      modelRef: t.modelRef,
      messages: t.messages,
      temperature: t.temperature,
      conversationId: t.convId,
      assistantMessageId: t.asstId,
      deps,
      hooks: t.hooks,
      priorMessages: this._priorMessages(t.convId, t.asstId),
      allowTakeover: !t.evalOverrides,
      modeSystemPrompt: AgentTurnDispatch._promptAppend(t.modeTurn, t.choicesOn, t.voiceOn, t.docsGrant),
      turnReminder: t.voiceOn ? ChatStyleDocs.VOICE_REMINDER : null,
      images: t.images,
      ...tools,
      ...AgentTurnDispatch._modeSeams(t.modeTurn, t.evalOverrides, t.docsGrant),
      ctxPerSlot: this._window.forRef(t.modelRef) || this._window.localPerSlot(),
      llmExtra: t.llmExtra,
      ...AgentTurnDispatch._evalExtras(t.evalOverrides),
      approvalOverride: t.approvalOverride,
    });
  }

  static _withDefaults(turn) {
    const {
      modeTurn = null, images = [], llmExtra = null, choicesOn = false, voiceOn = false, docsGrant = null,
      evalOverrides = null, approvalOverride = null,
    } = turn;
    return { ...turn, modeTurn, images, llmExtra, choicesOn, voiceOn, docsGrant, evalOverrides, approvalOverride };
  }

  static requireDeps(getAgentDeps) {
    const deps = getAgentDeps ? getAgentDeps() : null;
    if (!deps || !deps.browserService || !deps.artifactStore) throw new Error(AgentTurnDispatch.NOT_READY);
    return deps;
  }

  _priorMessages(convId, asstId) {
    try {
      if (!convId || !this._store || !this._store.listMessages) return [];
      return this._store.listMessages(convId).filter((m) => m && m.id !== asstId);
    } catch (_) {
      return [];
    }
  }

  _toolAccess(modeTurn, evalOverrides, convId, deps) {
    if (evalOverrides && Array.isArray(evalOverrides.allowedTools)) {
      return { allowedTools: evalOverrides.allowedTools.slice(), refreshAllowedTools: null };
    }
    if (modeTurn && Array.isArray(modeTurn.allowedTools) && modeTurn.allowedTools.length) {
      return { allowedTools: modeTurn.allowedTools.slice(), refreshAllowedTools: null };
    }
    return {
      allowedTools: this._policy.allowedFor(convId, deps),
      refreshAllowedTools: () => this._policy.allowedFor(convId, deps),
    };
  }

  static _withDocs(tools, docsGrant) {
    if (!docsGrant) return tools;
    const refresh = tools.refreshAllowedTools;
    return {
      allowedTools: DocsSourceGrant.allowing(tools.allowedTools, docsGrant),
      refreshAllowedTools: refresh ? () => DocsSourceGrant.allowing(refresh(), docsGrant) : null,
    };
  }

  static _promptAppend(modeTurn, choicesOn, voiceOn, docsGrant = null) {
    return [
      modeTurn && modeTurn.systemPrompt ? String(modeTurn.systemPrompt) : null,
      docsGrant ? docsGrant.note : null,
      !modeTurn && !voiceOn ? ChatStyleDocs.WIDGETS : null,
      choicesOn ? ChatStyleDocs.CHOICES : null,
      voiceOn ? ChatStyleDocs.VOICE : null,
    ].filter(Boolean).join('\n\n') || null;
  }

  static _modeSeams(modeTurn, evalOverrides, docsGrant = null) {
    const modeTools = modeTurn && Array.isArray(modeTurn.tools) ? modeTurn.tools : [];
    const extraTools = docsGrant ? [...modeTools, docsGrant.extraTool] : modeTools;
    return {
      extraTools: extraTools.length ? extraTools : null,
      noBrowser: !!(modeTurn && modeTurn.noBrowser),
      pinnedTabId: (modeTurn && modeTurn.workTabId != null) ? modeTurn.workTabId : null,
      agentBudget: AgentTurnDispatch._budget(modeTurn, evalOverrides),
      kbScope: (modeTurn && modeTurn.kbScope) ? String(modeTurn.kbScope) : null,
    };
  }

  static _budget(modeTurn, evalOverrides) {
    const modeBudget = (modeTurn && modeTurn.agentBudget) || null;
    if (!(evalOverrides && evalOverrides.parallel > 1)) return modeBudget;
    return { ...(modeBudget || {}), maxParallelToolCalls: evalOverrides.parallel };
  }

  static _evalExtras(evalOverrides) {
    return {
      nativeHistory: !!(evalOverrides && evalOverrides.nativeHistory),
      nativeToolsOverride: (evalOverrides && evalOverrides.nativeTools === 'off') ? 'off' : null,
      systemPromptOverride: evalOverrides ? (evalOverrides.systemPromptOverride ?? null) : undefined,
      promptExperiments: (evalOverrides && Array.isArray(evalOverrides.promptExperiments)) ? evalOverrides.promptExperiments : null,
    };
  }
}

module.exports = AgentTurnDispatch;
