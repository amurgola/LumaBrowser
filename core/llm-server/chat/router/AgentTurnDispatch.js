const ChatAssistantText = require('../ChatAssistantText');
const ChatStyleDocs = require('./ChatStyleDocs');
const ConversationGrants = require('../approval/ConversationGrants');
const ConversationJobReminder = require('../jobs/ConversationJobReminder');
const ConversationJobs = require('../jobs/ConversationJobs');
const PlanTool = require('../plan/PlanTool');
const BackgroundTasks = require('../tasks/BackgroundTasks');
const BackgroundTaskTools = require('../tasks/BackgroundTaskTools');

class AgentTurnDispatch {
  static NOT_READY = 'Tools aren’t ready yet: the browser is still starting up. Try again in a moment.';

  constructor({ agentBridge, chatStore, getAgentDeps, policy, contextWindow, jobs = ConversationJobs.shared, tasks = BackgroundTasks.shared }) {
    this._jobs = jobs;
    this._tasks = tasks;
    this._bridge = agentBridge;
    this._store = chatStore;
    this._getAgentDeps = getAgentDeps;
    this._policy = policy;
    this._window = contextWindow;
  }

  run(turn) {
    const deps = AgentTurnDispatch.requireDeps(this._getAgentDeps);
    const t = AgentTurnDispatch._withDefaults(turn);
    const grants = t.runApprovals || this._conversationGrants(t);
    const planTool = PlanTool.forTurn(this._store, t);
    if (planTool) planTool.beginTurn(t.hooks);
    const taskTools = BackgroundTaskTools.forTurn(t, { tasks: this._tasks, jobs: this._jobs });
    const sessionTools = [
      ...[t.docsGrant, planTool].filter(Boolean).map((source) => source.extraTool),
      ...(taskTools ? taskTools.extraTools : []),
    ];
    const tools = AgentTurnDispatch._admitting(this._toolAccess(t.modeTurn, t.evalOverrides, t.convId, deps), sessionTools);
    return this._bridge.run({
      modelRef: t.modelRef,
      messages: t.messages,
      temperature: t.temperature,
      conversationId: t.convId,
      assistantMessageId: t.asstId,
      userMessageId: t.userMessageId || null,
      userText: t.userText || null,
      deps,
      hooks: planTool ? planTool.watching(t.hooks) : t.hooks,
      priorMessages: this._priorMessages(t.convId, t.asstId),
      allowTakeover: !t.evalOverrides,
      systemRole: t.modeTurn ? null : ChatAssistantText.ROLE_TOOLS,
      modeSystemPrompt: AgentTurnDispatch._promptAppend(t.modeTurn, t.choicesOn, t.voiceOn, t.docsGrant, planTool, taskTools),
      turnReminder: AgentTurnDispatch._turnReminder(t.voiceOn, this._otherJobs(t.convId)),
      stepReminder: AgentTurnDispatch._stepReminder(planTool, taskTools),
      finalCheck: planTool ? () => planTool.beforeFinalAnswer() : null,
      awaitsLaterResult: taskTools ? () => taskTools.awaitsLaterResult : null,
      images: t.images,
      ...tools,
      ...AgentTurnDispatch._modeSeams(t.modeTurn, t.evalOverrides, sessionTools, t.modelBudget || null),
      ctxPerSlot: this._window.forRef(t.modelRef) || this._window.localPerSlot(),
      llmExtra: t.llmExtra,
      ...AgentTurnDispatch._evalExtras(t.evalOverrides),
      approvalOverride: t.approvalOverride,
      approvedTools: AgentTurnDispatch._approvedTools(grants, t.modeTurn),
      onRunApproval: grants && typeof grants.onGranted === 'function' ? grants.onGranted : null,
      onRunApprovalUsed: grants && typeof grants.onUsed === 'function' ? grants.onUsed : null,
    });
  }

  _otherJobs(convId) {
    return this._jobs.activeFor(convId).filter((job) => job.kind !== BackgroundTasks.JOB_KIND);
  }

  static _stepReminder(planTool, taskTools) {
    const sources = [planTool ? () => planTool.reminder() : null, taskTools ? () => taskTools.tail() : null].filter(Boolean);
    if (!sources.length) return null;
    return () => sources.map((source) => source()).filter(Boolean).join('\n\n') || null;
  }

  static _turnReminder(voiceOn, runningJobs) {
    const parts = [voiceOn ? ChatStyleDocs.VOICE_REMINDER : null, ConversationJobReminder.build(runningJobs)].filter(Boolean);
    return parts.length ? parts.join('\n') : null;
  }

  static _approvedTools(grants, modeTurn) {
    const carried = grants && Array.isArray(grants.granted) ? grants.granted : null;
    const fromMode = modeTurn && Array.isArray(modeTurn.preApprovedTools) ? modeTurn.preApprovedTools.map(String) : [];
    if (!carried && !fromMode.length) return null;
    return [...new Set([...(carried || []), ...fromMode])];
  }

  static _withDefaults(turn) {
    const {
      modeTurn = null, images = [], llmExtra = null, choicesOn = false, voiceOn = false, docsGrant = null,
      evalOverrides = null, approvalOverride = null, runApprovals = null,
    } = turn;
    return { ...turn, modeTurn, images, llmExtra, choicesOn, voiceOn, docsGrant, evalOverrides, approvalOverride, runApprovals };
  }

  static requireDeps(getAgentDeps) {
    const deps = getAgentDeps ? getAgentDeps() : null;
    if (!deps || !deps.browserService || !deps.artifactStore) throw new Error(AgentTurnDispatch.NOT_READY);
    return deps;
  }

  _conversationGrants(t) {
    if (!t.convId || t.evalOverrides || !this._store || typeof this._store.getMeta !== 'function') return null;
    return new ConversationGrants(this._store, t.convId).runApprovals();
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

  static _admitting(tools, sessionTools) {
    if (!sessionTools.length) return tools;
    const names = sessionTools.map((tool) => tool.name);
    const admit = (allowed) => (Array.isArray(allowed) ? [...new Set([...allowed, ...names])] : allowed);
    const refresh = tools.refreshAllowedTools;
    return {
      allowedTools: admit(tools.allowedTools),
      refreshAllowedTools: refresh ? () => admit(refresh()) : null,
    };
  }

  static _promptAppend(modeTurn, choicesOn, voiceOn, docsGrant = null, planTool = null, taskTools = null) {
    return [
      modeTurn && modeTurn.systemPrompt ? String(modeTurn.systemPrompt) : null,
      docsGrant ? docsGrant.note : null,
      planTool ? planTool.note : null,
      taskTools ? taskTools.note : null,
      !modeTurn ? ChatAssistantText.toolsAnswering() : null,
      !modeTurn && !voiceOn ? ChatStyleDocs.WIDGETS : null,
      choicesOn ? ChatStyleDocs.CHOICES : null,
      voiceOn ? ChatStyleDocs.VOICE : null,
    ].filter(Boolean).join('\n\n') || null;
  }

  static _modeSeams(modeTurn, evalOverrides, sessionTools = [], modelBudget = null) {
    const modeTools = modeTurn && Array.isArray(modeTurn.tools) ? modeTurn.tools : [];
    const extraTools = sessionTools.length ? [...modeTools, ...sessionTools] : modeTools;
    return {
      extraTools: extraTools.length ? extraTools : null,
      noBrowser: !!(modeTurn && modeTurn.noBrowser),
      pinnedTabId: (modeTurn && modeTurn.workTabId != null) ? modeTurn.workTabId : null,
      agentBudget: AgentTurnDispatch._budget(modeTurn, evalOverrides, modelBudget),
      kbScope: (modeTurn && modeTurn.kbScope) ? String(modeTurn.kbScope) : null,
    };
  }

  static _budget(modeTurn, evalOverrides, modelBudget = null) {
    const layers = [(modeTurn && modeTurn.agentBudget) || null, modelBudget || null];
    if (evalOverrides && evalOverrides.parallel > 1) layers.push({ maxParallelToolCalls: evalOverrides.parallel });
    const merged = Object.assign({}, ...layers.filter(Boolean));
    return Object.keys(merged).length ? merged : null;
  }

  static _evalExtras(evalOverrides) {
    return {
      nativeHistory: (evalOverrides && evalOverrides.nativeHistory != null) ? !!evalOverrides.nativeHistory : true,
      nativeToolsOverride: (evalOverrides && evalOverrides.nativeTools === 'off') ? 'off' : null,
      systemPromptOverride: evalOverrides ? (evalOverrides.systemPromptOverride ?? null) : undefined,
      promptExperiments: (evalOverrides && Array.isArray(evalOverrides.promptExperiments)) ? evalOverrides.promptExperiments : null,
    };
  }
}

module.exports = AgentTurnDispatch;
