const path = require('path');
const ChatModeRegistry = require('../../llm-server/chat/ChatModeRegistry');

class SharedAgents {
  static WEB_CHAT_MODE_IDS = new Set(['agent-chat']);
  static AGENT_CHAT_MODE_ID = 'agent-chat';
  static WEB_CHAT_UI_URL = '/sharing/agents/chat-ui.js';
  static ASSET_NAME_RE = /^[A-Za-z0-9_-]+\.js$/;
  static NOT_AVAILABLE = { status: 404, message: 'Not available' };

  constructor(service, { modeRegistry = ChatModeRegistry.shared } = {}) {
    this._service = service;
    this._modes = modeRegistry;
  }

  isShared() {
    try {
      return this._service.getShareFlags().shareAgents !== false;
    } catch (_) {
      return true;
    }
  }

  list() {
    if (!this.isShared()) return [];
    const manager = this._service.getAgentManager();
    try {
      return manager && typeof manager.listAgents === 'function' ? manager.listAgents() : [];
    } catch (_) {
      return [];
    }
  }

  chatUi() {
    if (!this.isShared()) return { status: 403, message: 'Custom agents are not shared' };
    const manager = this._service.getAgentManager();
    if (!manager || !manager.chatUiPath) return { ...SharedAgents.NOT_AVAILABLE };
    return { path: manager.chatUiPath };
  }

  chatUiAsset(name) {
    const bundle = this.chatUi();
    if (!bundle.path) return bundle;
    if (!SharedAgents.ASSET_NAME_RE.test(String(name))) return { ...SharedAgents.NOT_AVAILABLE };
    const dir = path.dirname(bundle.path);
    const wanted = path.resolve(dir, 'ui', String(name));
    return SharedAgents._declaredAssets(dir).includes(wanted) ? { path: wanted } : { ...SharedAgents.NOT_AVAILABLE };
  }

  webModes() {
    try {
      return this._modes.list()
        .filter((mode) => SharedAgents.WEB_CHAT_MODE_IDS.has(mode.id))
        .filter((mode) => mode.id !== SharedAgents.AGENT_CHAT_MODE_ID || this.isShared())
        .map((mode) => ({ ...mode, chatUiUrl: SharedAgents.WEB_CHAT_UI_URL }));
    } catch (_) {
      return [];
    }
  }

  resolveTurn(agentId) {
    if (!this.isShared()) return { refusal: SharedAgents._refusal(403, 'custom agents are not shared') };
    const turn = this._buildTurn(String(agentId));
    return turn ? { turn } : { refusal: SharedAgents._refusal(404, 'agent not found on host') };
  }

  _buildTurn(agentId) {
    const manager = this._service.getAgentManager();
    try {
      return manager && typeof manager.buildTurn === 'function' ? manager.buildTurn(agentId) : null;
    } catch (_) {
      return null;
    }
  }

  static _declaredAssets(dir) {
    try {
      const chatUi = require(path.join(dir, 'manifest.js')).chatUi;
      const assets = chatUi && Array.isArray(chatUi.assets) ? chatUi.assets : [];
      return assets.map((rel) => path.resolve(dir, rel));
    } catch (_) {
      return [];
    }
  }

  static _refusal(status, message) {
    return { status, body: { error: { message } } };
  }
}

module.exports = SharedAgents;
