const CdpDomain = require('./CdpDomain');
const CdpError = require('../CdpError');
const DomQuery = require('./DomQuery');
const TabForeground = require('./TabForeground');
const FallbackConfig = require('../FallbackConfig');
const LlmSelectorFallback = require('../LlmSelectorFallback');

class LumabyteDomain extends CdpDomain {
  handlers() {
    return {
      'Lumabyte.find': (params, scope) => this.find(params, scope.session),
      'Lumabyte.click': (params, scope) => this.click(params, scope.session),
      'Lumabyte.domSnapshot': (params, scope) => this.domSnapshot(params, scope.session),
      'Lumabyte.configureFallback': (params, scope) => this.configureFallback(params, scope.session),
      'Lumabyte.getInfo': (params, scope) => this.getInfo(scope.session),
    };
  }

  async find(params, session) {
    LumabyteDomain._requireSession(session, 'Lumabyte.find');
    return this._resolve(session, params || {});
  }

  async click(params, session) {
    LumabyteDomain._requireSession(session, 'Lumabyte.click');
    const resolved = await this._resolve(session, params || {});
    const tabId = this._liveTarget(session).tabId;
    const point = await this._pointFor(tabId, resolved.selector);
    await this._dispatchClick(tabId, point, (params && params.button) || 'left');
    return { clicked: true, selector: resolved.selector, strategy: resolved.strategy, x: point.x, y: point.y };
  }

  async domSnapshot(params, session) {
    LumabyteDomain._requireSession(session, 'Lumabyte.domSnapshot');
    const tabId = this._liveTarget(session).tabId;
    const wants = { ax: !!(params && params.includeAxTree), shot: !!(params && params.includeScreenshot) };
    const foreground = new TabForeground(this._server.browser);
    if (wants.shot) await foreground.bringForward(tabId);
    try {
      return await this._capture(tabId, wants);
    } finally {
      foreground.restore(tabId);
    }
  }

  async configureFallback(params, session) {
    LumabyteDomain._requireSession(session, 'Lumabyte.configureFallback');
    session.llmFallback = FallbackConfig.normalize(params || {}, this._server.fallbackDefaults);
    return { config: session.llmFallback };
  }

  async getInfo(session) {
    return {
      fallbackAvailable: !!this._server.fallback,
      config: session ? session.llmFallback : null,
      defaults: this._server.fallbackDefaults,
    };
  }

  async _resolve(session, { description, selector, retry }) {
    if (!description && !selector) throw CdpError.invalidParams('Lumabyte: description or selector is required');
    const tabId = this._liveTarget(session).tabId;
    if (selector && await DomQuery.exists(this._server.debugger, tabId, selector)) return { selector, strategy: 'selector' };
    if (retry === false) return LumabyteDomain._deterministicMiss(selector);
    this._requireFallback(session);
    const css = await LlmSelectorFallback.resolveDescription(this._server.fallback, tabId, description, 'find', selector || null);
    if (!css) throw CdpError.server('Lumabyte: LLM could not resolve a selector');
    return { selector: css, strategy: 'description' };
  }

  _requireFallback(session) {
    if (!this._server.fallback || !session.llmFallback.enabled) {
      throw CdpError.server('Lumabyte: LLM fallback is not available or disabled for this session');
    }
  }

  _liveTarget(session) {
    const target = this._server.targets.get(session.targetId);
    if (!target) throw CdpError.internal('Session has no live target');
    return target;
  }

  async _pointFor(tabId, selector) {
    const dbg = this._server.debugger;
    const nodeId = await DomQuery.nodeId(dbg, tabId, selector);
    if (!nodeId) throw CdpError.server('Lumabyte.click: selector resolved but querySelector returned no node');
    try { await dbg.sendCommand(tabId, 'DOM.scrollIntoViewIfNeeded', { nodeId }); } catch (_) {}
    const point = DomQuery.centerOf(await dbg.sendCommand(tabId, 'DOM.getBoxModel', { nodeId }));
    if (!point) throw CdpError.server('Lumabyte.click: could not read box model');
    return point;
  }

  async _dispatchClick(tabId, point, button) {
    const press = { x: point.x, y: point.y, button, clickCount: 1 };
    await this._server.debugger.sendCommand(tabId, 'Input.dispatchMouseEvent', { type: 'mousePressed', ...press, buttons: 1 });
    await this._server.debugger.sendCommand(tabId, 'Input.dispatchMouseEvent', { type: 'mouseReleased', ...press, buttons: 0 });
  }

  async _capture(tabId, wants) {
    const dbg = this._server.debugger;
    const [snapshot, axTree, shot] = await Promise.all([
      dbg.sendCommand(tabId, 'DOMSnapshot.captureSnapshot', { computedStyles: [] }),
      wants.ax ? dbg.sendCommand(tabId, 'Accessibility.getFullAXTree', {}) : null,
      wants.shot ? dbg.sendCommand(tabId, 'Page.captureScreenshot', { format: 'png' }) : null,
    ]);
    const out = { snapshot };
    if (axTree) out.axTree = axTree;
    if (shot) out.screenshot = shot.data;
    return out;
  }

  static _deterministicMiss(selector) {
    if (selector) return { selector, strategy: 'selector-miss' };
    throw CdpError.server('Lumabyte: selector missed and retry=false');
  }

  static _requireSession(session, method) {
    if (!session) throw CdpError.invalidRequest(`${method} requires a session`);
  }
}

module.exports = LumabyteDomain;
