const WatchFolder = require('../triggers/file/WatchFolder');
const WebhookPresets = require('../triggers/WebhookPresets');

class TriggerModeServices {
  constructor({
    getRunner = null, getFileWatch = null, getPageSource = null, getSecrets = null, getArtifactStore = null,
    getChatStore = null, getHookBaseUrls = null, getAgentManager = null, getNotificationSource = null,
  } = {}) {
    this._getters = {
      runner: getRunner,
      fileWatch: getFileWatch,
      pageSource: getPageSource,
      secrets: getSecrets,
      artifactStore: getArtifactStore,
      chatStore: getChatStore,
      hookBaseUrls: getHookBaseUrls,
      agentManager: getAgentManager,
      notificationSource: getNotificationSource,
    };
  }

  runner() { return this._get('runner'); }
  pageSource() { return this._get('pageSource'); }
  artifactStore() { return this._get('artifactStore'); }
  notificationSource() { return this._get('notificationSource'); }
  hookBaseUrls() { return this._get('hookBaseUrls'); }

  listAgents() {
    try {
      const manager = this._get('agentManager');
      const list = manager && typeof manager.listAgents === 'function' ? manager.listAgents() : null;
      return Array.isArray(list) ? list : null;
    } catch (_) {
      return null;
    }
  }

  resolveAgentId(raw) {
    if (raw === undefined) return { skip: true };
    const id = String(raw || '').trim();
    if (!id) return { agentId: null };
    const list = this.listAgents();
    if (!list) return { error: 'no configured agents are available (Agent Manager is off)' };
    const hit = list.find((a) => a.id === id) || list.find((a) => a.name.toLowerCase() === id.toLowerCase());
    if (!hit) return { error: `no configured agent "${id}"; available: ${list.map((a) => a.id).join(', ') || 'none'}` };
    return { agentId: hit.id };
  }

  secretStatus(trigger) {
    if (!trigger || trigger.kind !== 'webhook') return null;
    const source = trigger.source || {};
    const required = WebhookPresets.requiresSecret(source.preset, source);
    let set = false;
    try {
      const secrets = this._get('secrets');
      set = !!(secrets && secrets.has(trigger.id));
    } catch (_) {
      set = false;
    }
    return { required, set, note: required && !set ? 'REQUIRED and not set: the trigger will not fire until the user enters it in the runs view' : undefined };
  }

  validateDir(dir) {
    const fileWatch = this._getters.fileWatch && this._getters.fileWatch();
    if (fileWatch && typeof fileWatch.validateDir === 'function') return fileWatch.validateDir(dir);
    return WatchFolder.validate(dir);
  }

  runToolGroups(conversationId) {
    try {
      const runner = this.runner();
      return runner && typeof runner.describeRunTools === 'function' ? runner.describeRunTools(conversationId) : null;
    } catch (_) {
      return null;
    }
  }

  syncConversationTitle(conversationId, title) {
    try {
      const chatStore = this._get('chatStore');
      if (chatStore && title && typeof chatStore.renameConversation === 'function') chatStore.renameConversation(conversationId, title);
    } catch (_) {}
  }

  _get(name) {
    try {
      const getter = this._getters[name];
      return (getter && getter()) || null;
    } catch (_) {
      return null;
    }
  }
}

module.exports = TriggerModeServices;
