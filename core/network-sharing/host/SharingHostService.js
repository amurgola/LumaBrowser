const TokenStore = require('../TokenStore');
const ShareStore = require('../ShareStore');
const UsageStore = require('../UsageStore');
const FileMutationQueue = require('../../shell/FileMutationQueue');
const HostSettings = require('./HostSettings');
const HostListeners = require('./HostListeners');
const HostAdvertiser = require('./HostAdvertiser');
const HostManifestBuilder = require('./HostManifestBuilder');
const HostModelInventory = require('./HostModelInventory');
const HostDialPosition = require('./HostDialPosition');
const PinPairing = require('./PinPairing');
const ShareLinkPublisher = require('./ShareLinkPublisher');
const WebToolAllowList = require('./WebToolAllowList');
const LanAddress = require('./LanAddress');
const PublicUrlProbe = require('./PublicUrlProbe');

class SharingHostService {
  static DEFAULT_PORT = 3000;
  static IMAGE_QUEUE_KEY = 'image';

  constructor({ db, getPort, getChatRouter, getImageRouter, llmServerService, imageServerService, voiceServices, notifier, mcpAggregator, apiSecurity, discovery, getAgentManager, getAppVersion } = {}) {
    if (!db) throw new Error('SharingHostService requires a SettingsDatabase');
    this._settings = new HostSettings(db);
    this.tokens = new TokenStore(db);
    this.shares = new ShareStore(db);
    this.usage = new UsageStore(db);
    this.enabled = this._settings.readEnabled();
    this.instanceId = this._settings.instanceId();
    this._wireDependencies({ getPort, getChatRouter, getImageRouter, llmServerService, imageServerService, voiceServices, apiSecurity, getAgentManager, getAppVersion });
    this._wireCollaborators({ notifier, mcpAggregator, discovery });
  }

  _wireDependencies({ getPort, getChatRouter, getImageRouter, llmServerService, imageServerService, voiceServices, apiSecurity, getAgentManager, getAppVersion }) {
    this._getPort = typeof getPort === 'function' ? getPort : () => SharingHostService.DEFAULT_PORT;
    this._getChatRouter = getChatRouter || (() => global.__lumaChatRouter);
    this._getImageRouter = getImageRouter || (() => global.__lumaImageRouter);
    this._getAgentManager = getAgentManager || (() => global.__lumaAgentManager || null);
    this._getAppVersion = getAppVersion || SharingHostService._electronAppVersion;
    this._llm = llmServerService || null;
    this._image = imageServerService || null;
    this._voiceServices = voiceServices || null;
    this._apiSecurity = apiSecurity || null;
  }

  _wireCollaborators({ notifier, mcpAggregator, discovery }) {
    this._listeners = new HostListeners();
    this._advertiser = new HostAdvertiser(discovery ? { discovery } : {});
    this._inventory = new HostModelInventory({ llmServerService: this._llm, imageServerService: this._image });
    this._shareLinks = new ShareLinkPublisher({ host: this, shares: this.shares });
    this._allowList = new WebToolAllowList({ settings: this._settings, mcpAggregator });
    this._imageQueue = new FileMutationQueue();
    this.setNotifier(notifier);
    this._pairing = new PinPairing({
      settings: this._settings,
      tokens: this.tokens,
      getInstanceName: () => this.getInstanceName(),
      notify: (info) => { if (this._notifier) this._notifier(info); },
    });
  }


  isEnabled() {
    return !!this.enabled;
  }

  getPort() {
    try {
      return Number(this._getPort()) || SharingHostService.DEFAULT_PORT;
    } catch (_) {
      return SharingHostService.DEFAULT_PORT;
    }
  }

  getInstanceName() {
    return this._settings.getInstanceName();
  }

  getBindMode() {
    return this._settings.getBindMode();
  }

  getShareFlags() {
    return this._settings.getShareFlags();
  }

  getAppVersion() {
    return this._getAppVersion();
  }

  getInfo() {
    return {
      name: this.getInstanceName(),
      id: this.instanceId,
      proto: HostManifestBuilder.PROTO,
      requiresPin: true,
      enabled: this.isEnabled(),
      version: this.getAppVersion(),
      tls: this.getTlsInfo(),
    };
  }

  getConfig() {
    return {
      enabled: this.isEnabled(),
      hasPin: this._settings.hasPin(),
      instanceName: this.getInstanceName(),
      instanceId: this.instanceId,
      bindMode: this.getBindMode(),
      port: this.getPort(),
      tlsPort: this.getTlsPort(),
      tlsRunning: this._listeners.isTlsRunning(),
      tlsFingerprint: this._listeners.tlsFingerprint(),
      mdnsAvailable: this._advertiser.isAvailable(),
      gpuLendSupported: this._listeners.gpuLendSupported(),
      gpuLend: this._listeners.gpuLendStatus(),
      ...this.getShareFlags(),
      ...this.getWebConfig(),
      tokens: this.listTokens(),
      shareLinks: this.shares.list(),
    };
  }

  async setEnabled(enabled) {
    this._applyEnabled(!!enabled);
    if (!this.enabled) return this._disable();
    if (!this._settings.hasPin()) {
      this._applyEnabled(false);
      return { success: false, error: 'Set a PIN before enabling Network Sharing.' };
    }
    this._startAdvertise();
    await this._listeners.startOnEnable({ tlsPort: this.getTlsPort(), webPort: this.getWebPort(), webEnabled: this.isWebEnabled() });
    return { success: true, enabled: this.enabled };
  }

  _applyEnabled(enabled) {
    this.enabled = enabled;
    this._settings.writeEnabled(enabled);
  }

  async _disable() {
    this._advertiser.stop();
    await this._listeners.stopOnDisable();
    return { success: true, enabled: this.enabled };
  }

  setPin(pin) {
    if (!this._settings.setPin(pin)) return { success: false, error: 'PIN must be 4 to 8 digits.' };
    this._pairing.reset();
    if (this.isEnabled()) this._startAdvertise();
    return { success: true };
  }

  clearPin() {
    this._settings.clearPin();
    if (this.isEnabled()) this.setEnabled(false);
    return { success: true };
  }

  setInstanceName(name) {
    this._settings.setInstanceName(name);
    if (this.isEnabled()) this._startAdvertise();
    return { success: true, instanceName: this.getInstanceName() };
  }

  setBindMode(mode) {
    this._settings.setBindMode(mode);
    return { success: true, bindMode: this.getBindMode() };
  }

  setShareFlag(flag, value) {
    if (!this._settings.setShareFlag(flag, value)) return { success: false, error: `Unknown share flag "${flag}"` };
    if (flag === 'shareGpus' && !value) this._listeners.releaseGpusNow();
    return { success: true, ...this.getShareFlags() };
  }


  setRpcLending(service) {
    this._listeners.setRpcLending(service);
  }

  getRpcLending() {
    return this._listeners.getRpcLending();
  }

  setTlsServer(server) {
    this._listeners.setTlsServer(server);
  }

  getTlsPort() {
    return this._settings.getTlsPort();
  }

  async setTlsPort(port) {
    const valid = HostSettings.validPort(port);
    if (!valid) return { success: false, error: 'Port must be a number from 1 to 65535.' };
    this._settings.setTlsPort(valid);
    if (this.isEnabled() && this._listeners.hasTlsServer()) {
      const result = await this._listeners.startTls(valid);
      if (!result.success) return { success: false, error: result.error, tlsPort: valid };
    }
    return { success: true, tlsPort: valid };
  }

  getTlsInfo() {
    return this._listeners.tlsInfo();
  }


  setWebServer(server) {
    this._listeners.setWebServer(server);
  }

  registerWebMount(prefix, handlers) {
    return this._listeners.registerWebMount(prefix, handlers);
  }

  isWebEnabled() {
    return this._settings.isWebEnabled();
  }

  isWebRunning() {
    return this._listeners.isWebRunning();
  }

  getWebPort() {
    return this._settings.getWebPort();
  }

  getWebConfig() {
    return {
      webEnabled: this.isWebEnabled(),
      webPort: this.getWebPort(),
      webRunning: this.isWebRunning(),
      webAllowedTools: this.getWebAllowedTools(),
      webPublicUrl: this.getWebPublicUrl(),
      toolGroups: this._allowList.toolGroups(),
    };
  }

  async setWebEnabled(enabled) {
    const next = !!enabled;
    this._settings.setWebEnabled(next);
    if (!this._listeners.hasWebServer()) return { success: true };
    if (!next) {
      await this._listeners.stopWeb();
      return { success: true };
    }
    if (!this.isEnabled()) return { success: true, pending: true };
    const result = await this._listeners.startWeb(this.getWebPort());
    if (result.success) return { success: true };
    this._settings.setWebEnabled(false);
    return { success: false, error: result.error };
  }

  async setWebPort(port) {
    const valid = HostSettings.validPort(port);
    if (!valid) return { success: false, error: 'Port must be a number from 1 to 65535.' };
    this._settings.setWebPort(valid);
    if (this.isEnabled() && this.isWebEnabled() && this._listeners.hasWebServer()) {
      const result = await this._listeners.startWeb(valid);
      if (!result.success) return { success: false, error: result.error, webPort: valid };
    }
    return { success: true, webPort: valid };
  }

  getWebPublicUrl() {
    return this._settings.getWebPublicUrl();
  }

  setWebPublicUrl(url) {
    return this._settings.setWebPublicUrl(url);
  }

  async checkPublicUrlReachable({ fetch, timeoutMs } = {}) {
    const publicUrl = this.getWebPublicUrl();
    if (!publicUrl) return { skipped: true };
    if (!this.isEnabled() || !this.isWebEnabled() || !this.isWebRunning()) {
      return {
        ok: false,
        publicUrl,
        error: `Public URL ${publicUrl} is set but the web backend is not running. Enable Network Sharing and the web backend, or clear the URL.`,
      };
    }
    const result = await PublicUrlProbe.probe(publicUrl, { instanceId: this.instanceId, fetch, timeoutMs });
    return { ...result, publicUrl };
  }

  getWebAllowedTools() {
    return this._allowList.get();
  }

  setWebAllowedTools(tools) {
    return this._allowList.set(tools);
  }


  listTokens() {
    return this.tokens.list().map((token) => ({ ...token, usage: this.usage.get(token.id) }));
  }

  revokeToken(id) {
    return { success: this.tokens.revoke(id) };
  }

  removeToken(id) {
    const removed = this.tokens.remove(id);
    if (removed) this.usage.remove(id);
    return { success: removed };
  }

  revokeAllTokens() {
    this.tokens.revokeAll();
    return { success: true };
  }

  verifyToken(token) {
    return this.tokens.verify(token);
  }

  verifyCredential(token) {
    if (!token) return null;
    const entry = this.tokens.verify(token);
    if (entry) return entry;
    if (this._apiSecurity && typeof this._apiSecurity.isValidKey === 'function' && this._apiSecurity.isValidKey(token)) {
      return { id: 'api-key', label: 'Core API key', viaApiKey: true };
    }
    return null;
  }

  recordUsage(entry, delta) {
    if (!entry || entry.viaApiKey || !entry.id) return;
    this.usage.record(entry.id, delta || {});
  }


  pair(pin, options = {}) {
    return this._pairing.pair(pin, options);
  }

  setNotifier(fn) {
    this._notifier = typeof fn === 'function' ? fn : null;
  }


  getShareLinkStatus() {
    return this._shareLinks.status();
  }

  createShareLink(args = {}) {
    return this._shareLinks.create(args);
  }

  resolveShare(token) {
    return this._shareLinks.resolve(token);
  }

  listShareLinks() {
    return this.shares.list();
  }

  revokeShareLink(id) {
    return { success: this.shares.revoke(id) };
  }

  revokeAllShareLinks() {
    this.shares.revokeAll();
    return { success: true };
  }

  lanAddress() {
    return LanAddress.pick();
  }


  buildManifest() {
    return new HostManifestBuilder({ host: this, inventory: this._inventory, llmServerService: this._llm, imageServerService: this._image }).execute();
  }

  async allowedLlmRefs() {
    return new Set((await this.buildManifest()).llms.map((model) => model.ref));
  }

  imageModelDenied(role, modelId) {
    return this._inventory.imageModelDenied(role, modelId);
  }

  hostDialPosition() {
    return HostDialPosition.of(this._llm);
  }


  getChatRouter() {
    return this._getChatRouter();
  }

  getImageRouter() {
    return this._getImageRouter();
  }

  getChatStore() {
    return (this._llm && this._llm.chatStore) || null;
  }

  getVoiceServices() {
    return this._voiceServices;
  }

  getAgentManager() {
    return this._getAgentManager();
  }

  enqueueImage(fn) {
    return this._imageQueue.run(SharingHostService.IMAGE_QUEUE_KEY, fn);
  }

  async shutdown() {
    this._advertiser.stop();
    await this._listeners.shutdown();
  }

  _startAdvertise() {
    this._advertiser.start({
      name: this.getInstanceName(),
      port: this.getPort(),
      instanceId: this.instanceId,
      proto: HostManifestBuilder.PROTO,
      tlsPort: this.getTlsPort(),
    });
  }

  static _electronAppVersion() {
    try {
      return require('electron').app.getVersion();
    } catch (_) {
      return null;
    }
  }
}

module.exports = SharingHostService;
