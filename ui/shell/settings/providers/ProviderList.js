import DefaultProviderControl from './DefaultProviderControl.js';
import ManagedProviderCard from './ManagedProviderCard.js';
import PeerProviderCard from './PeerProviderCard.js';
import EditableProviderCard from './EditableProviderCard.js';
import AddProviderForm from './AddProviderForm.js';

export default class ProviderList {
  static EMPTY = '<div class="luma-empty">No providers configured. Click "+ Add Provider" to get started.</div>';

  constructor({ log, feedback }) {
    this.configs = [];
    this._ctx = { list: this, log, feedback, pingChat: ProviderList.pingChatPanel };
    this._defaults = new DefaultProviderControl({ log, feedback, rerender: () => this.render(), pingChat: ProviderList.pingChatPanel });
    this._addForm = new AddProviderForm(this._ctx);
  }

  install() {
    document.addEventListener('settings:open', () => { this.render(); });
    this._addForm.install();
  }

  static pingChatPanel() {
    if (window.lumaAiChatPanel) window.lumaAiChatPanel.checkLlmAvailability();
  }

  save() {
    return window.ipcBridge.invoke('core.llm.saveProviderConfigs', this.configs);
  }

  async add(config) {
    this.configs.push(config);
    await this.save();
  }

  async remove(id) {
    this.configs = this.configs.filter((c) => c.id !== id);
    await this.save();
  }

  async render() {
    if (!window.ipcBridge) return;
    const state = await this._loadState();
    const listEl = document.getElementById('providerList');
    if (!listEl) return;
    listEl.innerHTML = '';
    this._defaults.render(listEl, { configs: this.configs, activeKey: state.activeKey, imageCfg: state.imageCfg });
    if (this.configs.length === 0) listEl.insertAdjacentHTML('beforeend', ProviderList.EMPTY);
    for (const config of this.configs) listEl.appendChild(this._card(config, state.peersById));
  }

  _card(config, peersById) {
    if (config.managedByCore) return ManagedProviderCard.build(config);
    if (config.peerManaged) return PeerProviderCard.build(config, peersById[config.peerId] || null, this._ctx);
    return EditableProviderCard.build(config, this._ctx);
  }

  async _loadState() {
    try { this.configs = await window.ipcBridge.invoke('core.llm.getProviderConfigs') || []; } catch { this.configs = []; }
    let activeKey = 'none';
    try { activeKey = (await window.electronAPI.getLlmProviderConfig())?.provider || 'none'; } catch {}
    let peersById = {};
    try {
      const peers = window.sharingAPI ? await window.sharingAPI.listPeers() : [];
      peersById = Object.fromEntries((peers || []).map((p) => [p.id, p]));
    } catch {}
    let imageCfg = null;
    try {
      const r = window.imageServersAPI ? await window.imageServersAPI.getServerConfigs() : null;
      if (r && r.success) imageCfg = r;
    } catch {}
    return { activeKey, peersById, imageCfg };
  }
}
