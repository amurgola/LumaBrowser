class TriggerPromptExtras {
  static ARTIFACT_LIMIT = 40;
  static DELIVERY_LIMIT = 6;
  static VERSION_LIMIT = 5;
  static PARKED_NOTE = 'a run is PARKED waiting for the user to allow or deny this tool on the card; you cannot answer for them';

  static build(services, triggerStore, trigger) {
    const extras = {};
    const agents = services.listAgents();
    if (agents) extras.agents = agents;
    TriggerPromptExtras._try(extras, 'tabs', () => TriggerPromptExtras._tabs(services));
    TriggerPromptExtras._monitors(extras, services);
    TriggerPromptExtras._try(extras, 'artifacts', () => TriggerPromptExtras._artifacts(services));
    if (trigger) TriggerPromptExtras._triggerContext(extras, services, triggerStore, trigger);
    return extras;
  }

  static _triggerContext(extras, services, triggerStore, trigger) {
    extras.secret = services.secretStatus(trigger);
    TriggerPromptExtras._try(extras, 'pendingApproval', () => TriggerPromptExtras._pendingApproval(services, trigger));
    TriggerPromptExtras._try(extras, 'deliveries', () => triggerStore.listDeliveries(trigger.id, { limit: TriggerPromptExtras.DELIVERY_LIMIT })
      .map((d) => ({ at: d.at, source: d.source, outcome: d.outcome, detail: d.detail || undefined })));
    TriggerPromptExtras._try(extras, 'versions', () => triggerStore.listVersions(trigger.id).slice(0, TriggerPromptExtras.VERSION_LIMIT));
  }

  static _tabs(services) {
    const source = services.notificationSource();
    return source && typeof source.listTabs === 'function' ? source.listTabs() : undefined;
  }

  static _monitors(extras, services) {
    const pageSource = services.pageSource();
    if (!pageSource) return;
    try {
      extras.monitors = pageSource.listMonitors();
    } catch (_) {
      extras.monitors = [];
    }
  }

  static _artifacts(services) {
    const store = services.artifactStore();
    return store && typeof store.listLiveRoots === 'function' ? store.listLiveRoots({ limit: TriggerPromptExtras.ARTIFACT_LIMIT }) : undefined;
  }

  static _pendingApproval(services, trigger) {
    const runner = services.runner();
    const parked = runner && typeof runner.pendingApproval === 'function' ? runner.pendingApproval(trigger.id) : null;
    if (!parked) return undefined;
    return { tool: parked.tool, detail: parked.detail, since: parked.since, note: TriggerPromptExtras.PARKED_NOTE };
  }

  static _try(extras, key, read) {
    try {
      const value = read();
      if (value !== undefined) extras[key] = value;
    } catch (_) {}
  }
}

module.exports = TriggerPromptExtras;
