const WebDriverCommandGroup = require('./WebDriverCommandGroup');
const WebDriverError = require('../WebDriverError');

class CaptureCommands extends WebDriverCommandGroup {
  commandNames() {
    return ['takeScreenshot', 'takeElementScreenshot', 'printPage'];
  }

  async takeScreenshot(session) {
    return this._tools.screenshots.capture(session.tabId);
  }

  async takeElementScreenshot(session, params) {
    await this._elements.resolve(session, params['element id']);
    return this.takeScreenshot(session);
  }

  async printPage() {
    throw WebDriverError.unsupportedOperation('print not implemented in v1');
  }
}

module.exports = CaptureCommands;
