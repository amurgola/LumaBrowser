const { ipcMain } = require('electron');
const IpcEnvelope = require('../shared/ipc/IpcEnvelope');
const Firewall = require('./Firewall');

class SharingIpcHandlers {
  constructor({ hostService, clientService, getPorts } = {}) {
    this._host = hostService;
    this._client = clientService;
    this._getPorts = typeof getPorts === 'function' ? getPorts : () => [];
  }

  register() {
    this._registerHostSettings();
    this._registerFirewall();
    this._registerShareLinks();
    this._registerTokens();
    this._registerClient();
  }

  _registerHostSettings() {
    this._handle('core.sharing.host.getConfig', () => this._host.getConfig());
    this._handle('core.sharing.host.setEnabled', async (_e, enabled) => this._withConfig(await this._host.setEnabled(enabled)));
    this._handle('core.sharing.host.setPin', (_e, pin) => this._withConfig(this._host.setPin(pin)));
    this._handle('core.sharing.host.clearPin', () => this._withConfig(this._host.clearPin()));
    this._handle('core.sharing.host.setInstanceName', (_e, name) => this._withConfig(this._host.setInstanceName(name)));
    this._handle('core.sharing.host.setBindMode', (_e, mode) => this._withConfig(this._host.setBindMode(mode)));
    this._handle('core.sharing.host.setWebEnabled', async (_e, enabled) => this._withConfig(await this._host.setWebEnabled(enabled)));
    this._handle('core.sharing.host.setWebPort', async (_e, port) => this._withConfig(await this._host.setWebPort(port)));
    this._handle('core.sharing.host.setTlsPort', async (_e, port) => this._withConfig(await this._host.setTlsPort(port)));
    this._handle('core.sharing.host.setWebAllowedTools', (_e, tools) => this._withConfig(this._host.setWebAllowedTools(tools)));
    this._handle('core.sharing.host.setShareFlag', (_e, flag, value) => this._withConfig(this._host.setShareFlag(flag, value)));
    this._handle('core.sharing.host.setWebPublicUrl', (_e, url) => this._withConfig(this._host.setWebPublicUrl(url)));
  }

  _registerFirewall() {
    this._handle('core.sharing.host.firewall.getStatus', () => Firewall.detect());
    this._handle('core.sharing.host.firewall.allow', () => Firewall.ensureAllowed({
      exePath: process.execPath,
      appPath: process.execPath,
      ports: this._getPorts(),
    }));
  }

  _registerShareLinks() {
    this._handle('core.sharing.shareLink.status', () => this._host.getShareLinkStatus());
    this._handle('core.sharing.shareLink.create', (_e, args) => this._host.createShareLink(args || {}));
    this._handle('core.sharing.shareLink.list', () => this._host.listShareLinks());
    this._handle('core.sharing.shareLink.revoke', (_e, id) => this._host.revokeShareLink(id));
    this._handle('core.sharing.shareLink.revokeAll', () => this._host.revokeAllShareLinks());
  }

  _registerTokens() {
    this._handle('core.sharing.host.listTokens', () => this._host.listTokens());
    this._handle('core.sharing.host.revokeToken', (_e, id) => this._host.revokeToken(id));
    this._handle('core.sharing.host.removeToken', (_e, id) => this._host.removeToken(id));
    this._handle('core.sharing.host.revokeAllTokens', () => this._host.revokeAllTokens());
  }

  _registerClient() {
    this._handle('core.sharing.client.listPeers', () => this._client.listPeers());
    this._handle('core.sharing.client.probe', (_e, address, port) => this._client.probe(address, port));
    this._handle('core.sharing.client.pair', (_e, address, pin, port) => this._client.pair(address, pin, { port }));
    this._handle('core.sharing.client.refreshPeer', (_e, id) => this._client.refreshPeer(id));
    this._handle('core.sharing.client.setPeerEnabled', (_e, id, enabled) => this._client.setPeerEnabled(id, enabled));
    this._handle('core.sharing.client.setPeerGpusAttached', (_e, id, attached) => this._client.setPeerGpusAttached(id, attached));
    this._handle('core.sharing.client.removePeer', (_e, id) => this._client.removePeer(id));
    this._handle('core.sharing.client.getDiscovered', () => this._client.getDiscovered());
    this._handle('core.sharing.client.startDiscovery', () => { this._client.startDiscovery(); return { success: true }; });
    this._handle('core.sharing.client.stopDiscovery', () => { this._client.stopDiscovery(); return { success: true }; });
  }

  _withConfig(result) {
    return { ...result, config: this._host.getConfig() };
  }

  _handle(channel, fn) {
    ipcMain.handle(channel, IpcEnvelope.raw(fn));
  }
}

module.exports = SharingIpcHandlers;
