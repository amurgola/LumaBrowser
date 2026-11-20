class GambitProvenance {
  static meta({ llmServerService, defaults, livePath, modelRef, modelLabel, startedAt, filtered, options }) {
    const { nativeHistory, nativeTools, agentEffort, parallel, promptExperiments } = options;
    return {
      modelPath: livePath,
      modelRef,
      modelName: modelLabel || (defaults && defaults.modelName) || null,
      ...GambitProvenance.effectiveContext(llmServerService, defaults),
      ...GambitProvenance.placement(llmServerService),
      kvCacheType: defaults ? defaults.kvCacheType : null,
      startedAt,
      filtered,
      nativeHistory: !!nativeHistory,
      nativeTools: nativeTools === 'off' ? 'off' : 'default',
      agentEffort: agentEffort || null,
      parallel: (parallel > 1) ? parallel : null,
      promptExperiments: (Array.isArray(promptExperiments) && promptExperiments.length) ? promptExperiments.slice() : null,
    };
  }

  static effectiveContext(llmServerService, defaults) {
    const requested = defaults && Number(defaults.contextSize) > 0 ? Math.floor(Number(defaults.contextSize)) : null;
    const eff = GambitProvenance._effective(llmServerService);
    return {
      contextSize: eff && eff.contextWindow > 0 ? eff.contextWindow : requested,
      contextRequested: requested,
      ctxPerSlot: eff && eff.ctxPerSlot > 0 ? eff.ctxPerSlot : null,
      slots: eff && eff.slots > 0 ? eff.slots : null,
      contextSource: eff ? eff.source : null,
    };
  }

  static placement(llmServerService) {
    try {
      const plan = GambitProvenance._livePlan(llmServerService);
      if (!plan) return { placement: null };
      const args = Array.isArray(plan.args) ? plan.args : [];
      const split = GambitProvenance._flagValue(args, '--tensor-split');
      return {
        placement: {
          gpus: split ? split.split(',').filter(Boolean).length : 1,
          tensorSplit: split,
          splitMode: GambitProvenance._flagValue(args, '--split-mode'),
          ngl: GambitProvenance._flagValue(args, '-ngl'),
        },
      };
    } catch (_) {
      return { placement: null };
    }
  }

  static noteContextDrift(report, llmServerService, defaults) {
    try {
      const current = llmServerService.getDefaults ? llmServerService.getDefaults() : defaults;
      const end = GambitProvenance.effectiveContext(llmServerService, current);
      if (report && report.meta && end.contextSize !== report.meta.contextSize) {
        report.meta.contextChangedDuringRun = { from: report.meta.contextSize, to: end.contextSize };
      }
    } catch (_) {}
  }

  static isPersistable(meta) {
    if (!meta) return true;
    return !meta.filtered && !meta.nativeHistory && meta.nativeTools !== 'off' && !meta.agentEffort && !meta.parallel && !meta.promptExperiments;
  }

  static _effective(llmServerService) {
    try {
      return llmServerService && llmServerService.getEffectiveContext ? llmServerService.getEffectiveContext() : null;
    } catch (_) {
      return null;
    }
  }

  static _livePlan(llmServerService) {
    const server = llmServerService && llmServerService.runtimeServer;
    const status = server && server.getStatus ? server.getStatus() : null;
    return status && status.plan;
  }

  static _flagValue(args, flag) {
    const i = args.indexOf(flag);
    return i >= 0 && args[i + 1] ? String(args[i + 1]) : null;
  }
}

module.exports = GambitProvenance;
