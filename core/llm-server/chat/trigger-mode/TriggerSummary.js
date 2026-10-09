const TriggerFacts = require('./TriggerFacts');

class TriggerSummary {
  static of(trigger, services) {
    const out = {
      id: trigger.id,
      title: trigger.title,
      kind: trigger.kind,
      status: trigger.status,
      statusMeaning: TriggerFacts.describeStatus(trigger.status, trigger.kind),
      mode: trigger.action && trigger.action.mode,
      agent: TriggerFacts.agent(trigger, services.listAgents()),
      enabled: trigger.enabled,
      ...TriggerSummary._kindFacts(trigger, services),
    };
    if (trigger.action && trigger.action.expect) out.expect = trigger.action.expect;
    if (trigger.action && trigger.action.artifactRootId) out.artifactRootId = trigger.action.artifactRootId;
    const gating = TriggerFacts.gating(trigger);
    if (gating) out.gating = gating;
    return out;
  }

  static _kindFacts(trigger, services) {
    if (trigger.kind === 'file') return { watch: TriggerFacts.watch(trigger) };
    if (trigger.kind === 'page') return { page: TriggerFacts.page(trigger) };
    if (trigger.kind === 'notification') return { notification: TriggerFacts.notification(trigger) };
    const source = trigger.source || {};
    return {
      respond: source.respond,
      preset: source.preset,
      urls: TriggerFacts.hookUrls(trigger, services.hookBaseUrls()),
      secret: services.secretStatus(trigger),
    };
  }
}

module.exports = TriggerSummary;
