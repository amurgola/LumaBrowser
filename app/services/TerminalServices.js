const path = require('path');
const TerminalProfileRegistry = require('../../core/terminal/shells/TerminalProfileRegistry');
const ShellIntegrationFiles = require('../../core/terminal/shells/ShellIntegrationFiles');
const ShellLaunch = require('../../core/terminal/shells/ShellLaunch');
const TerminalHostClient = require('../../core/terminal/TerminalHostClient');
const TerminalService = require('../../core/terminal/TerminalService');
const TerminalSettings = require('../../core/terminal/TerminalSettings');
const TerminalViewerSessions = require('../../core/terminal/TerminalViewerSessions');
const TerminalTabContext = require('../../core/terminal/TerminalTabContext');
const AppGlobals = require('../AppGlobals');

class TerminalServices {
  static INTEGRATION_DIR = ['terminal', 'shell-integration'];

  constructor(ctx) {
    this._ctx = ctx;
    this._s = ctx.services;
  }

  build() {
    const s = this._s;
    s.terminalProfiles = new TerminalProfileRegistry({ db: s.db });
    s.terminalSettings = new TerminalSettings({ db: s.db, profiles: s.terminalProfiles });
    s.terminalService = AppGlobals.publish('__lumaTerminal', this._buildService(s.terminalProfiles));
    s.terminalViewers = new TerminalViewerSessions({ service: s.terminalService, getTabViewManager: () => this._ctx.tabViewManager });
    return s.terminalService;
  }

  _buildService(profiles) {
    let service = null;
    const host = new TerminalHostClient({ onEvent: (event) => service.onHostEvent(event) });
    const tabContext = new TerminalTabContext({ getTabViewManager: () => this._ctx.tabViewManager });
    service = new TerminalService({ host, profiles, launch: this._buildLaunch(), apiPort: () => this._ctx.apiPort, tabContext });
    return service;
  }

  _buildLaunch() {
    const dir = path.join(this._ctx.app.getPath('userData'), ...TerminalServices.INTEGRATION_DIR);
    return new ShellLaunch({ files: new ShellIntegrationFiles(dir), appVersion: this._ctx.app.getVersion() });
  }
}

module.exports = TerminalServices;
