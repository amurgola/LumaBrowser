const WebDriverCommandGroup = require('./WebDriverCommandGroup');
const WebDriverError = require('../WebDriverError');

class AlertCommands extends WebDriverCommandGroup {
  commandNames() {
    return ['dismissAlert', 'acceptAlert', 'getAlertText', 'sendAlertText'];
  }

  async dismissAlert(session) {
    return this._handle(session, { action: 'dismiss' });
  }

  async acceptAlert(session) {
    return this._handle(session, { action: 'accept' });
  }

  async getAlertText() {
    throw WebDriverError.unsupportedOperation('alert text not exposed in v1');
  }

  async sendAlertText(session, _params, req) {
    return this._handle(session, { action: 'accept', text: AlertCommands._body(req).text });
  }

  async _handle(session, options) {
    const res = await this._browser.handleDialog(session.tabId, options);
    if (!res || !res.success) throw WebDriverError.noSuchAlert('no pending dialog');
    return null;
  }
}

module.exports = AlertCommands;
