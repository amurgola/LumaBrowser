const WebDriverCommandGroup = require('./WebDriverCommandGroup');
const WebDriverError = require('../WebDriverError');
const WebDriverSession = require('../WebDriverSession');
const ElementScripts = require('../ElementScripts');

class ActionCommands extends WebDriverCommandGroup {
  commandNames() {
    return ['performActions', 'releaseActions'];
  }

  async performActions(session, _params, req) {
    const { actions } = ActionCommands._body(req);
    const sources = Array.isArray(actions) ? actions : [];
    const ticks = sources.reduce((max, source) => Math.max(max, (source.actions || []).length), 0);
    for (let tick = 0; tick < ticks; tick++) await this._runTick(session, sources, tick);
    return null;
  }

  async releaseActions() {
    return null;
  }

  async _runTick(session, sources, tick) {
    for (const source of sources) {
      const action = (source.actions || [])[tick];
      if (action) await this._dispatch(session, source, action);
    }
  }

  async _dispatch(session, source, action) {
    if (action.type === 'pause') return;
    if (source.type === 'pointer' && action.type === 'pointerMove') await this._moveTo(session, action.origin);
    if (source.type === 'wheel' && action.type === 'scroll') await this._scroll(session, action);
  }

  async _moveTo(session, origin) {
    if (!origin || typeof origin !== 'object' || !origin[WebDriverSession.ELEMENT_KEY]) return;
    const entry = session.getElement(origin[WebDriverSession.ELEMENT_KEY]);
    if (!entry) throw WebDriverError.staleElementReference('pointer origin element stale');
    await this._elements.evaluate(session, entry, "if (el) el.scrollIntoView({block:'center'}); return true;");
  }

  async _scroll(session, action) {
    await this._page.run(session.tabId, `window.scrollBy(${action.deltaX | 0}, ${action.deltaY | 0})`);
  }
}

module.exports = ActionCommands;
