const EvalEventCapture = require('./EvalEventCapture');

class EvalTurn {
  static TIMEOUT_MS = 5 * 60 * 1000;

  constructor(router) {
    this._router = router;
    this._store = (router && router.chatStore) || null;
  }

  async run({
    task, variant = {}, modelRef = null, timeoutMs = EvalTurn.TIMEOUT_MS, prompt = null, priorMessages = [],
    conversationId = null, nativeHistory = false, nativeTools = null, agentEffort = null, parallel = null,
    promptExperiments = null,
  }) {
    const started = Date.now();
    const turnPrompt = prompt != null ? String(prompt) : String((task && task.prompt) || '');
    const convId = conversationId || `eval-${task && task.id}`;
    const priorList = Array.isArray(priorMessages) ? priorMessages : [];
    if (priorList.length === 0) this._recreateConversation(convId, task, modelRef);
    const overrides = EvalTurn._overrides({ task, variant, nativeHistory, nativeTools, agentEffort, parallel, promptExperiments });
    const capture = await this._drive({ convId, modelRef, turnPrompt, priorList, overrides, timeoutMs });
    return this._transcript(capture, started);
  }

  _recreateConversation(convId, task, modelRef) {
    const store = this._store;
    if (!store) return;
    try { if (store.getConversation(convId)) store.deleteConversation(convId); } catch (_) {}
    try {
      store.createConversation({ id: convId, title: `[eval] ${(task && task.id) || 'task'}`, modelRef, toolsEnabled: true, hidden: true });
    } catch (_) {}
  }

  static _overrides({ task, variant, nativeHistory, nativeTools, agentEffort, parallel, promptExperiments }) {
    const v = variant || {};
    return {
      systemPromptOverride: typeof v.buildPrompt === 'function' ? v.buildPrompt : (v.systemPrompt != null ? v.systemPrompt : null),
      allowedTools: Array.isArray(task && task.allowedTools) ? task.allowedTools : null,
      nativeHistory: !!nativeHistory,
      nativeTools: nativeTools === 'off' ? 'off' : null,
      agentEffort: agentEffort || null,
      parallel: (parallel > 1) ? parallel : null,
      promptExperiments: (Array.isArray(promptExperiments) && promptExperiments.length) ? promptExperiments : null,
    };
  }

  _drive({ convId, modelRef, turnPrompt, priorList, overrides, timeoutMs }) {
    return new Promise((resolve) => {
      let timer = null;
      let settled = false;
      const capture = new EvalEventCapture(() => finish());
      const finish = () => {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        resolve(capture);
      };
      Promise.resolve()
        .then(() => this._router.chat({
          conversationId: convId,
          modelRef,
          messages: [...EvalTurn._wireHistory(priorList), { role: 'user', content: turnPrompt }],
          userMessage: turnPrompt,
          agent: true,
          send: capture.send,
          evalOverrides: overrides,
        }))
        .then((res) => {
          if (res && res.success === false) {
            capture.fail(new Error(res.error || 'chat failed'));
            finish();
          }
        })
        .catch((e) => {
          capture.fail(e instanceof Error ? e : new Error(String(e)));
          finish();
        });
      if (timeoutMs > 0) timer = this._armTimeout(timeoutMs, capture, () => settled, finish);
    });
  }

  _armTimeout(timeoutMs, capture, isSettled, finish) {
    const timer = setTimeout(() => {
      if (isSettled()) return;
      capture.fail(new Error(`eval run timed out after ${Math.round(timeoutMs / 1000)}s`));
      try { if (this._router && typeof this._router.abort === 'function') this._router.abort(); } catch (_) {}
      finish();
    }, timeoutMs);
    if (timer.unref) timer.unref();
    return timer;
  }

  static _wireHistory(priorList) {
    return priorList
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant'))
      .map((m) => ({ role: m.role, content: String(m.content == null ? '' : m.content) }));
  }

  _persistedRow(assistantMessageId) {
    try {
      const row = (assistantMessageId && this._store) ? this._store.getMessage(assistantMessageId) : null;
      const tc = row && row.toolCalls;
      return {
        tools: (tc && Array.isArray(tc.tools)) ? tc.tools : [],
        artifacts: (tc && Array.isArray(tc.artifacts)) ? tc.artifacts : [],
      };
    } catch (_) {
      return { tools: [], artifacts: [] };
    }
  }

  _transcript(capture, started) {
    const { tools, artifacts } = this._persistedRow(capture.assistantMessageId);
    const toolCalls = tools.map((t) => ({ tool: t.tool, params: t.params || {}, success: t.status === 'ok', error: t.error || null }));
    const doneInfo = capture.doneInfo;
    return {
      finalResponse: capture.text,
      iterations: (doneInfo && typeof doneInfo.iterations === 'number') ? doneInfo.iterations : (toolCalls.length + 1),
      durationMs: Date.now() - started,
      timings: (doneInfo && doneInfo.timings) || null,
      turnTimings: (doneInfo && doneInfo.turnTimings) || null,
      toolCalls,
      artifacts,
      error: capture.error ? capture.error.message : null,
      health: EvalTurn._health(capture, toolCalls),
    };
  }

  static _health(capture, toolCalls) {
    const doneInfo = capture.doneInfo;
    const stopReason = (doneInfo && doneInfo.stopReason) || null;
    const errMsg = capture.error ? capture.error.message : null;
    const count = (key) => (doneInfo && Number(doneInfo[key] || 0)) || 0;
    return {
      repetitionAborted: stopReason === 'repetition',
      timedOut: !!(errMsg && /timed out/i.test(errMsg)),
      offFormatCalls: count('offFormatCalls'),
      offFormatShapes: (doneInfo && doneInfo.offFormatShapes) || {},
      emptyReply: !capture.text.trim() && toolCalls.length === 0 && !errMsg,
      stopReason,
      compactions: capture.compactions,
      lengthCutCompletions: count('lengthCutCompletions'),
      missingArgCalls: count('missingArgCalls'),
      overflowRecoveries: count('overflowRecoveries'),
    };
  }
}

module.exports = EvalTurn;
