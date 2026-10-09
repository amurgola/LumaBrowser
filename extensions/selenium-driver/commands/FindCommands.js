const WebDriverCommandGroup = require('./WebDriverCommandGroup');
const WebDriverError = require('../WebDriverError');
const ElementScripts = require('../ElementScripts');

class FindCommands extends WebDriverCommandGroup {
  static MARK_ACTIVE_SCRIPT = `
    (function(){
      const a = document.activeElement;
      if (!a) return null;
      const mark = '__lb_active_' + Date.now();
      a.setAttribute('data-lb-active', mark);
      return mark;
    })()
  `;

  commandNames() {
    return [
      'findElement', 'findElements', 'findElementFromElement', 'findElementsFromElement',
      'getActiveElement', 'getElementShadowRoot', 'findElementFromShadow', 'findElementsFromShadow',
    ];
  }

  async findElement(session, _params, req) {
    return FindCommands._first(await this._find(session, req), 'No element matched the locator');
  }

  async findElements(session, _params, req) {
    return this._find(session, req);
  }

  async findElementFromElement(session, params, req) {
    await this._elements.resolve(session, params['element id']);
    return FindCommands._first(await this._find(session, req), 'No child element matched');
  }

  async findElementsFromElement(session, params, req) {
    await this._elements.resolve(session, params['element id']);
    return this._find(session, req);
  }

  async getActiveElement(session) {
    const mark = await this._page.run(session.tabId, FindCommands.MARK_ACTIVE_SCRIPT);
    if (!mark) throw WebDriverError.noSuchElement('no active element');
    const selector = `[data-lb-active="${mark}"]`;
    return session.registerElement({
      using: 'css selector', value: selector, scopeSelector: null,
      selector: ElementScripts.encode('css selector', selector, null, 0),
    });
  }

  async getElementShadowRoot(session, params) {
    const entry = await this._elements.resolve(session, params['element id']);
    const hasShadow = await this._elements.evaluate(session, entry, 'return !!(el && el.shadowRoot);');
    if (!hasShadow) throw WebDriverError.noSuchShadowRoot('element has no shadow root');
    return session.registerShadow({ selector: entry.selector });
  }

  async findElementFromShadow() {
    throw WebDriverError.unsupportedOperation('shadow find not implemented in v1');
  }

  async findElementsFromShadow() {
    throw WebDriverError.unsupportedOperation('shadow find not implemented in v1');
  }

  _find(session, req) {
    return this._tools.finder.findAll(session, FindCommands._body(req), null);
  }

  static _first(refs, message) {
    if (refs.length === 0) throw WebDriverError.noSuchElement(message);
    return refs[0];
  }
}

module.exports = FindCommands;
