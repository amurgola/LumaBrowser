const path = require('path');
const ExtensionGlobals = require('../../core/shell/extensions/ExtensionGlobals');
const RendererBroadcast = require('../../core/shell/extensions/RendererBroadcast');
const DesktopToken = require('./DesktopToken');
const DesktopHandshake = require('./DesktopHandshake');
const DesktopBroadcast = require('./DesktopBroadcast');
const DesktopIpcHandlers = require('./DesktopIpcHandlers');
const ClientRegistry = require('./ClientRegistry');
const FeatureCatalog = require('./FeatureCatalog');
const FeatureRegistry = require('./FeatureRegistry');
const FeatureDeps = require('./FeatureDeps');
const AppWindows = require('./shared/AppWindows');
const ChatHandoff = require('./shared/ChatHandoff');
const Speech = require('./shared/Speech');
const ActivityOverlay = require('./shared/ActivityOverlay');
const GlobalShortcuts = require('./shared/GlobalShortcuts');
const KWinPlacement = require('./shared/KWinPlacement');
const KWinScripting = require('./shared/KWinScripting');
const KWinWindows = require('./shared/KWinWindows');
const HintContributions = require('./shared/HintContributions');
const X11Bridge = require('./features/hotkeys/X11Bridge');

class DesktopIntegrationExtension {
  static APP_NAME = 'LumaBrowser';
  static API_BASE = DesktopHandshake.API_BASE;
  static LOOPBACK = '127.0.0.1';
  static CLIENTS_EVENT_MS = 2000;

  constructor(overrides = {}) {
    this._overrides = overrides;
    this._api = null;
    this._parts = null;
  }

  async activate(context) {
    const parts = this._buildParts(context);
    parts.registry.load(FeatureCatalog.discover(this._overrides.featuresDir || path.join(__dirname, 'features')));
    this._parts = parts;
    this._api = this._buildApi(parts);
    DesktopIpcHandlers.register(context.ipc, this._api);
    return this._api;
  }

  async deactivate() {
    const parts = this._parts;
    if (parts) {
      parts.registry.disposeAll();
      try { parts.speech.stop(); } catch (_) {}
      try { parts.overlay.dispose(); } catch (_) {}
      try { parts.shortcuts.dispose(); } catch (_) {}
      if (parts.bridge) { try { parts.bridge.stop(); } catch (_) {} }
      parts.handshake.remove();
    }
    this._parts = null;
    this._api = null;
  }

  getApi() {
    return this._api;
  }

  _buildParts(context) {
    const o = this._overrides;
    const now = o.now || (() => new Date());
    const version = o.version || DesktopIntegrationExtension._appVersion();
    const token = new DesktopToken(context.db, o.random ? { random: o.random } : {});
    const broadcast = o.broadcast || new DesktopBroadcast();
    const clients = new ClientRegistry({ now, onChange: this._clientsNotifier(broadcast) });
    const windows = o.windows || new AppWindows({ browser: context.browser || null });
    const handoff = o.handoff || new ChatHandoff({
      getLlm: () => ExtensionGlobals.llmServerService(),
      getChatStore: () => { const router = ExtensionGlobals.chatRouter(); return (router && router.chatStore) || null; },
      windows,
    });
    const speech = o.speech || new Speech({
      getTts: () => (context.sharedServices && context.sharedServices.ttsServer) || null,
      send: (channel, payload) => RendererBroadcast.send(channel, payload),
    });
    const overlayLog = FeatureDeps.logger(context.logger, 'overlay');
    const kwin = KWinWindows.shared({ log: overlayLog });
    const overlay = o.overlay || new ActivityOverlay({
      displayFor: (hwnd) => DesktopIntegrationExtension._kwinDisplay(kwin, hwnd) || DesktopIntegrationExtension._displayFor(hwnd),
      frameFor: (hwnd) => (kwin && kwin.frameOf(hwnd)) || DesktopIntegrationExtension._frameFor(hwnd),
      placement: KWinPlacement.forSession({ scripting: KWinScripting.shared({ log: overlayLog }), log: overlayLog }),
      log: overlayLog,
    });
    const hints = o.hints || new HintContributions({ log: FeatureDeps.logger(context.logger, 'hints') });
    const bridge = o.bridge !== undefined ? o.bridge : X11Bridge.forSession({ log: FeatureDeps.logger(context.logger, 'x11-bridge') });
    const shortcuts = o.shortcuts || new GlobalShortcuts({ globalShortcut: DesktopIntegrationExtension._globalShortcut(), bridge, log: FeatureDeps.logger(context.logger, 'shortcuts') });
    const parts = { token, broadcast, clients, windows, handoff, speech, overlay, hints, bridge, shortcuts, version, now };
    parts.handshake = new DesktopHandshake({
      filePath: o.handshakePath, version, now,
      getToken: () => token.get(),
      getFeatures: () => (parts.registry ? parts.registry.enabledIds() : []),
    });
    const features = {
      enabled: () => (parts.registry ? parts.registry.enabledIds() : []),
      isEnabled: (id) => !!(parts.registry && parts.registry.routerFor(String(id))),
    };
    const deps = new FeatureDeps(context, { broadcast, handoff, speech, overlay, hints, bridge, shortcuts, windows, clients, features, appInfo: () => this._appInfo(parts) });
    parts.registry = new FeatureRegistry({
      db: context.db,
      buildDeps: (descriptor) => deps.build(descriptor),
      onChange: () => { parts.handshake.refresh(); broadcast.emit('features.changed', { features: parts.registry.enabledIds() }); },
      log: FeatureDeps.logger(context.logger, 'registry'),
    });
    return parts;
  }

  _buildApi(parts) {
    const { token, clients, registry, handshake, handoff, speech, windows } = parts;
    return {
      info: () => this._info(parts),
      hello: () => ({ name: DesktopIntegrationExtension.APP_NAME, apiBase: DesktopIntegrationExtension.API_BASE, version: parts.version }),
      rotateToken: () => this._rotate(parts),
      listFeatures: () => registry.list(),
      setFeatureEnabled: (id, enabled) => registry.setEnabled(String(id), !!enabled),
      setFeatureSetting: (id, key, value) => registry.setSetting(String(id), String(key), value),
      listClients: () => clients.list(),
      clearClients: () => { clients.clear(); return true; },
      setGatewayPort: (port) => handshake.setPort(port),
      handshakePath: () => handshake.filePath,
      desktopToken: () => token,
      clientRegistry: () => clients,
      featureRegistry: () => registry,
      handoff,
      speech,
      windows,
    };
  }

  _rotate({ token, handshake, broadcast }) {
    const fresh = token.rotate();
    handshake.refresh();
    broadcast.emit('token.rotated', {});
    return fresh;
  }

  _info(parts) {
    const { token, handshake, registry, clients, version } = parts;
    const port = handshake.port;
    return {
      token: token.get(),
      handshakePath: handshake.filePath,
      handshakeWritten: handshake.written,
      port,
      apiBase: DesktopIntegrationExtension.API_BASE,
      baseUrl: port ? `http://${DesktopIntegrationExtension.LOOPBACK}:${port}${DesktopIntegrationExtension.API_BASE}` : null,
      version,
      features: registry.list(),
      failed: registry.failed(),
      clients: clients.list(),
    };
  }

  _appInfo(parts) {
    const handshake = parts.handshake;
    return {
      name: DesktopIntegrationExtension.APP_NAME,
      version: parts.version,
      platform: process.platform,
      apiBase: DesktopIntegrationExtension.API_BASE,
      handshakePath: handshake.filePath,
      get port() { return handshake.port; },
    };
  }

  _clientsNotifier(broadcast) {
    let last = 0;
    return () => {
      const t = Date.now();
      if (t - last < DesktopIntegrationExtension.CLIENTS_EVENT_MS) return;
      last = t;
      broadcast.emit('clients.changed', {});
    };
  }

  static _frameFor(hwnd) {
    if (process.platform !== 'win32' || !hwnd) return null;
    const { screen } = require('electron');
    const Win32Windows = require('../../core/desktop/win32/Win32Windows');
    const rect = Win32Windows.windowRect(hwnd);
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;
    return screen.screenToDipRect(null, rect);
  }

  static _kwinDisplay(kwin, hwnd) {
    const frame = kwin && hwnd ? kwin.frameOf(hwnd) : null;
    if (!frame) return null;
    try { return require('electron').screen.getDisplayMatching(frame); } catch (_) { return null; }
  }

  static _displayFor(hwnd) {
    if (process.platform !== 'win32' || !hwnd) return null;
    const { screen } = require('electron');
    const Win32Windows = require('../../core/desktop/win32/Win32Windows');
    const rect = Win32Windows.windowRect(hwnd);
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;
    return screen.getDisplayMatching(screen.screenToDipRect(null, rect));
  }

  static _globalShortcut() {
    try { return require('electron').globalShortcut || null; } catch (_) { return null; }
  }

  static _appVersion() {
    try {
      const { app } = require('electron');
      if (app && typeof app.getVersion === 'function') return app.getVersion();
    } catch (_) {}
    try { return require('../../package.json').version; } catch (_) { return null; }
  }
}

module.exports = DesktopIntegrationExtension;
