const fs = require('fs');
const path = require('path');
const AndroidEnvironment = require('./AndroidEnvironment');
const AndroidIpcHandlers = require('./AndroidIpcHandlers');
const DeviceManager = require('./DeviceManager');
const DeviceTabs = require('./DeviceTabs');
const DeviceSession = require('./device/DeviceSession');
const DeviceSessions = require('./device/DeviceSessions');
const TangoModules = require('./device/TangoModules');
const NotificationRelay = require('./relay/NotificationRelay');
const AndroidSettings = require('./settings/AndroidSettings');
const AndroidToolCalls = require('./tools/AndroidToolCalls');
const ViewerSocket = require('./web/ViewerSocket');
const ViewerTokens = require('./web/ViewerTokens');

class AndroidExtension {
  static SERVER_FILE = path.join(__dirname, 'resources', 'scrcpy-server-v3.3.4');
  static SHUTDOWN_WAIT_MS = 3000;

  constructor({ loadTango = TangoModules.load, readFile = fs.promises.readFile, openSession = DeviceSession.open } = {}) {
    this._loadTango = loadTango;
    this._readFile = readFile;
    this._openDeviceSession = openSession;
    this._settings = new AndroidSettings(null);
    this._devices = null;
    this._sessions = null;
    this._toolCalls = null;
  }

  async activate(context) {
    this._settings = new AndroidSettings(context.db);
    const environment = new AndroidEnvironment({ settings: this._settings });
    this._sessions = this._buildSessions(environment);
    this._devices = new DeviceManager({ environment, sessions: this._sessions });
    const gatewayInfo = { baseUrl: null };
    const tabs = new DeviceTabs({ browser: context.browser, gatewayInfo });
    const tokens = new ViewerTokens();
    this._toolCalls = new AndroidToolCalls({ devices: this._devices, sessions: this._sessions, tabs, settings: this._settings });
    this._relayNotifications(context);
    AndroidIpcHandlers.register(context.ipc, { devices: this._devices, tabs, settings: this._settings });
    return {
      devices: this._devices, sessions: this._sessions, tokens, settings: this._settings, gatewayInfo,
      viewerSocket: new ViewerSocket({ tokens, sessions: this._sessions, settings: this._settings }),
    };
  }

  async deactivate() {
    if (!this._devices) return;
    const shutdown = this._settings.read().stopOnQuit ? this._devices.stopStarted() : this._sessions.closeAll();
    const waited = new Promise((resolve) => { setTimeout(resolve, AndroidExtension.SHUTDOWN_WAIT_MS).unref(); });
    await Promise.race([shutdown.catch(() => {}), waited]);
  }

  toolCalls() {
    return this._toolCalls;
  }

  _buildSessions(environment) {
    return new DeviceSessions({
      startDevice: (name) => environment.required().fleet.start(name),
      openSession: (device) => this._openSession(device),
    });
  }

  async _openSession({ name, serial }) {
    const [tango, serverJar] = await Promise.all([this._loadTango(), this._readFile(AndroidExtension.SERVER_FILE)]);
    return this._openDeviceSession({ name, serial, tango, serverJar });
  }

  _relayNotifications(context) {
    const relay = new NotificationRelay({
      getHub: () => (context.extensions ? context.extensions['personal-hub'] : null),
      settings: this._settings,
    });
    this._sessions.on('posted', (deviceName, notification) => relay.forward(deviceName, notification));
  }
}

module.exports = AndroidExtension;
