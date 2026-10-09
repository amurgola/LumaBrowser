const { app } = require('electron');
const CdpDomain = require('./CdpDomain');

class BrowserDomain extends CdpDomain {
  static PROTOCOL_VERSION = '1.3';

  static NO_BOUNDS = { left: 0, top: 0, width: 0, height: 0, windowState: 'normal' };

  handlers() {
    return {
      'Browser.getVersion': () => this.getVersion(),
      'Browser.close': () => this.close(),
      'Browser.getWindowForTarget': (params) => this.getWindowForTarget(params),
    };
  }

  async getVersion() {
    return {
      protocolVersion: BrowserDomain.PROTOCOL_VERSION,
      product: 'LumaBrowser/1.0 (CDP-compatible)',
      revision: '@luma',
      userAgent: app.userAgentFallback || '',
      jsVersion: process.versions.v8 || '',
    };
  }

  async close() {
    await this._server.closeAutomationTabs();
    return {};
  }

  async getWindowForTarget(params) {
    const target = this._server.targets.get(params && params.targetId);
    return { windowId: target ? 1 : 0, bounds: { ...BrowserDomain.NO_BOUNDS } };
  }
}

module.exports = BrowserDomain;
