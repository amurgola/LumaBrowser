const WebDriverCommandGroup = require('./WebDriverCommandGroup');
const WebDriverError = require('../WebDriverError');
const WebDriverSession = require('../WebDriverSession');
const ElementScripts = require('../ElementScripts');

class ScriptCommands extends WebDriverCommandGroup {
  commandNames() {
    return ['getPageSource', 'executeScript', 'executeAsyncScript'];
  }

  async getPageSource(session) {
    const res = await this._browser.getSource(session.tabId, { type: 'full' });
    if (!res.success) throw WebDriverError.unknownError(res.error || 'source failed');
    return res.source;
  }

  async executeScript(session, _params, req) {
    const body = ScriptCommands._body(req);
    if (typeof body.script !== 'string') throw WebDriverError.invalidArgument('script is required');
    const args = Array.isArray(body.args) ? body.args : [];
    const argsJs = `[${args.map((arg) => ScriptCommands._argExpression(arg, session)).join(',')}]`;
    try {
      return await this._page.run(session.tabId, `(function(){ return (function() { ${body.script} }).apply(null, ${argsJs}); })()`);
    } catch (err) {
      throw WebDriverError.javascriptError(err.message || 'script execution failed');
    }
  }

  async executeAsyncScript() {
    throw WebDriverError.unsupportedOperation('execute async not implemented in v1');
  }

  static _argExpression(arg, session) {
    if (!arg || typeof arg !== 'object' || !arg[WebDriverSession.ELEMENT_KEY]) return JSON.stringify(arg);
    const entry = session.getElement(arg[WebDriverSession.ELEMENT_KEY]);
    return entry ? ElementScripts.query(entry.selector) : 'null';
  }
}

module.exports = ScriptCommands;
