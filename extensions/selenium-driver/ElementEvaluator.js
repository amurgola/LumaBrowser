const WebDriverError = require('./WebDriverError');
const ElementScripts = require('./ElementScripts');

class ElementEvaluator {
  constructor(pageScript) {
    this._page = pageScript;
  }

  async resolve(session, elementUuid) {
    const entry = session.getElement(elementUuid);
    if (!entry) throw WebDriverError.noSuchElement(`Unknown element id: ${elementUuid}`);
    const attached = await this._page.run(session.tabId, `${ElementScripts.query(entry.selector)} !== null`);
    if (!attached) throw WebDriverError.staleElementReference(`Element is no longer attached: ${entry.selector}`);
    return entry;
  }

  evaluate(session, entry, body) {
    return this._page.run(session.tabId, ElementScripts.onElement(entry.selector, body));
  }

  async read(session, elementUuid, body) {
    const entry = await this.resolve(session, elementUuid);
    return this.evaluate(session, entry, body);
  }

  async readAttached(session, elementUuid, body) {
    const value = await this.read(session, elementUuid, body);
    if (value === null) throw WebDriverError.staleElementReference('element detached');
    return value;
  }
}

module.exports = ElementEvaluator;
