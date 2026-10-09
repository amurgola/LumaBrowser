const WebhookPresets = require('../chat/triggers/WebhookPresets');

class TriggerDetails {
  constructor({ deps, agentManager = () => global.__lumaAgentManager }) {
    this._store = deps.get('triggerStore');
    this._runner = deps.get('triggerRunner');
    this._secrets = deps.get('triggerSecrets');
    this._watches = deps.get('fileWatchManager');
    this._hookBaseUrls = deps.get('getHookBaseUrls');
    this._agentManager = agentManager;
  }

  get(id) {
    const trigger = this._store ? this._store.get(id) : null;
    return {
      trigger,
      baseUrls: this._baseUrls(trigger),
      watch: this._watch(trigger, id),
      secret: this._secret(trigger, id),
      pending: this._pending(trigger, id),
      versions: trigger && this._store ? this._store.versionInfo(id) : null,
      agent: this._agent(trigger),
    };
  }

  _baseUrls(trigger) {
    return (trigger && trigger.kind === 'webhook' && this._hookBaseUrls) ? this._hookBaseUrls() : null;
  }

  _watch(trigger, id) {
    return (trigger && trigger.kind === 'file' && this._watches) ? this._watches.status(id) : null;
  }

  _secret(trigger, id) {
    if (!trigger || trigger.kind !== 'webhook') return null;
    return {
      required: WebhookPresets.requiresSecret(trigger.source && trigger.source.preset, trigger.source),
      set: !!(this._secrets && this._secrets.has(id)),
      encrypted: !!(this._secrets && this._secrets.encryptionAvailable()),
    };
  }

  _pending(trigger, id) {
    if (!trigger || !this._runner) return null;
    const ask = (name, fallback) => (typeof this._runner[name] === 'function' ? this._runner[name](id) : fallback);
    return { retry: ask('pendingRetry', null), batch: ask('batchDepth', 0), approval: ask('pendingApproval', null), deferred: ask('deferredStatus', null) };
  }

  _agent(trigger) {
    const agentId = trigger && trigger.action && trigger.action.agentId;
    if (!agentId) return null;
    const manager = this._agentManager();
    const list = manager && typeof manager.listAgents === 'function' ? manager.listAgents() : [];
    const hit = Array.isArray(list) ? list.find((a) => a.id === agentId) : null;
    return hit ? { id: hit.id, name: hit.name, missing: false } : { id: agentId, name: agentId, missing: true };
  }
}

module.exports = TriggerDetails;
