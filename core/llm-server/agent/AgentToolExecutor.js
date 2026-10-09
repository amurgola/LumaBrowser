const AgentLoopText = require('./AgentLoopText');
const TabLookup = require('./TabLookup');
const WorkTab = require('./WorkTab');

class AgentToolExecutor {
  static NAVIGATION_SETTLE_MS = 1500;
  static ACTION_SETTLE_MS = 800;

  constructor(options) {
    this._browserTools = options.browserTools;
    this._browserService = options.browserService;
    this._screenshotVision = !!options.screenshotVision;
    this._wait = options.wait || AgentToolExecutor._sleep;
    this._tabLookup = new TabLookup(options.browserService);
  }

  async execute(tool, params, defaultTabId) {
    const call = AgentToolExecutor._resolveCall(params, defaultTabId);
    try {
      return await this._dispatch(tool, call.params, call.tabId);
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  static _resolveCall(params, defaultTabId) {
    let resolved = params || {};
    const tabId = (resolved.tabId !== undefined && resolved.tabId !== WorkTab.LAZY_DEFAULT_TAB) ? resolved.tabId : defaultTabId;
    if (typeof tabId === 'number' && tabId >= 0 && resolved.tabId !== tabId) resolved = { ...resolved, tabId };
    return { params: resolved, tabId };
  }

  _dispatch(tool, params, tabId) {
    switch (tool) {
      case 'navigate': return this._navigate(params, tabId);
      case 'create_tab': return this._createTab(params, tabId);
      case 'click':
      case 'type':
      case 'click_at':
      case 'locate': return this._pageAction(tool, params, tabId);
      case 'screenshot': return this._screenshot(params);
      default: return this._browserTools.executeTool(tool, params, this._browserService);
    }
  }

  async _navigate(params, tabId) {
    const result = await this._browserTools.executeTool('navigate', params, this._browserService);
    if (result.success) await this._afterPageLoad(result, tabId, AgentToolExecutor.NAVIGATION_SETTLE_MS);
    return result;
  }

  async _createTab(params, tabId) {
    const result = await this._browserTools.executeTool('create_tab', params, this._browserService);
    if (result.success && params.url) {
      await this._afterPageLoad(result, result.data?.id ?? tabId, AgentToolExecutor.NAVIGATION_SETTLE_MS);
    }
    return result;
  }

  async _pageAction(tool, params, tabId) {
    const result = await this._browserTools.executeTool(tool, params, this._browserService);
    if (result.success && result.urlChanged) await this._afterPageLoad(result, tabId, AgentToolExecutor.ACTION_SETTLE_MS);
    return result;
  }

  async _afterPageLoad(result, digestTabId, settleMs) {
    await this._wait(settleMs);
    await this._tabLookup.attachDigest(result, digestTabId);
  }

  async _screenshot(params) {
    const result = await this._browserTools.executeTool('screenshot', params, this._browserService);
    if (!result.success) return result;
    const pixels = result.data?.screenshot || null;
    if (this._screenshotVision && pixels) return AgentToolExecutor._visibleScreenshot(result, params, pixels);
    return { success: true, message: AgentLoopText.SCREENSHOT_HIDDEN, mimeType: result.data?.mimeType };
  }

  static _visibleScreenshot(result, params, pixels) {
    const frame = result.data?.frame;
    const extra = [];
    if (frame && !params.fullPage) extra.push(AgentLoopText.screenshotSize(frame.imageWidth, frame.imageHeight));
    if (result.data?.marks?.text) extra.push(result.data.marks.text);
    return {
      success: true,
      message: [AgentLoopText.SCREENSHOT_ATTACHED, ...extra].join('\n'),
      mimeType: result.data?.mimeType,
      imageBase64: pixels,
    };
  }

  static _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = AgentToolExecutor;
