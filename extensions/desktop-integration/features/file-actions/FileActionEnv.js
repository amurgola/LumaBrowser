const ExtensionGlobals = require('../../../../core/shell/extensions/ExtensionGlobals');
const ImageSlotRoles = require('../../../../core/image-server/service/ImageSlotRoles');

class FileActionEnv {
  constructor(deps, {
    globals = ExtensionGlobals,
    getAgentManager = () => global.__lumaAgentManager || null,
    getRag = () => global.__lumaRagService || null,
    makeKnowledge = FileActionEnv._defaultKnowledge,
  } = {}) {
    this._deps = deps || {};
    this._globals = globals;
    this._getAgentManager = getAgentManager;
    this._getRag = getRag;
    this._makeKnowledge = makeKnowledge;
  }

  canChat() {
    return FileActionEnv._safe(() => {
      const llm = this._globals.llmServerService();
      return !!(llm && typeof llm.openChat === 'function' && typeof llm.setChatIntent === 'function');
    });
  }

  canSpeak() {
    return FileActionEnv._safe(() => !!(this._deps.speech && this._deps.speech.available()));
  }

  canEditImages() {
    return FileActionEnv._safe(() => {
      const images = this._globals.imageServerService();
      if (!images || typeof images.isRoleReady !== 'function') return false;
      return !!(images.isRoleReady(ImageSlotRoles.EDIT) || images.isRoleReady(ImageSlotRoles.GENERATE));
    });
  }

  agents() {
    try {
      if (!this._getRag()) return [];
      const manager = this._getAgentManager();
      const list = manager && typeof manager.listAgents === 'function' ? manager.listAgents() : [];
      return Array.isArray(list) ? list : [];
    } catch (_) {
      return [];
    }
  }

  async ingest(agentId, files) {
    return this._makeKnowledge(this._getRag).ingest(agentId, files);
  }

  static _defaultKnowledge(getRag) {
    const AgentKnowledgeBase = require('../../../agent-manager/AgentKnowledgeBase');
    return new AgentKnowledgeBase({ getRagService: getRag });
  }

  static _safe(fn) {
    try { return fn(); } catch (_) { return false; }
  }
}

module.exports = FileActionEnv;
