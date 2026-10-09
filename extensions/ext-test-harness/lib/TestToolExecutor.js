const BrowserTools = require('../../../core/llm-service/BrowserTools');

class TestToolExecutor {
  constructor({ browserService }) {
    this._browser = browserService;
  }

  async execute(tool, params) {
    try {
      return await this._dispatch(tool, params);
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  _dispatch(tool, params) {
    switch (tool) {
      case 'click': return this._click(params);
      case 'screenshot': return this._screenshot(params);
      default: return BrowserTools.executeTool(tool, params, this._browser);
    }
  }

  async _click(params) {
    const result = await BrowserTools.executeTool('click', params, this._browser);
    if (result.success && result.data && result.data.urlChanged) {
      result.urlChanged = true;
      result.newUrl = result.data.newUrl;
    }
    return result;
  }

  async _screenshot(params) {
    const result = await BrowserTools.executeTool('screenshot', params, this._browser);
    if (!result.success) return result;
    return { success: true, message: 'Screenshot captured', mimeType: result.data && result.data.mimeType };
  }
}

module.exports = TestToolExecutor;
