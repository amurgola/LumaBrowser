const ApiResponse = require('./models/ApiResponse');
const TabUrl = require('./TabUrl');
const BrowserRequestParser = require('./controller/BrowserRequestParser');
const FormFieldResolver = require('./controller/FormFieldResolver');
const NavigationStamp = require('./controller/NavigationStamp');
const NetworkLogQuery = require('./controller/NetworkLogQuery');
const PlainTab = require('./controller/PlainTab');
const RestFallbackReply = require('./controller/RestFallbackReply');
const SelectorFallback = require('./controller/SelectorFallback');

class BrowserController {
  static FALLBACK_REPLIES = {
    click: { ok: 'Element clicked successfully', failed: 'Failed to click element', stampNavigation: true },
    fill: { ok: 'Form filled successfully', failed: 'Failed to fill form' },
    wait: { ok: 'Element found', failed: 'Wait failed', failedStatus: 408 },
    scroll: { ok: 'Scrolled successfully', failed: 'Failed to scroll' },
    'get-table': { ok: 'Table data extracted successfully', failed: 'Failed to extract table data' },
    'press-key': { ok: 'Key pressed successfully', failed: 'Failed to press key' },
    'get-element': { ok: 'Element info retrieved', failed: 'Failed to get element' },
  };

  static SELECTOR_REQUIRED = ['selector is required', 'Please provide a CSS selector or llmFallback'];

  constructor(tabManager, networkInterceptor, llmFallbackService) {
    this.tabManager = tabManager;
    this.networkInterceptor = networkInterceptor || null;
    this.llmFallbackService = llmFallbackService || null;
  }

  getAllTabs(req, res) {
    return this._guard(res, async () => {
      const result = await this.tabManager.getAllTabs({ includeSilent: req.query.includeSilent === 'true' });
      if (!result.success) return this._fail(res, 500, result.error, 'Failed to retrieve tabs');
      this._ok(res, result.tabs.map(PlainTab.from), 'Tabs retrieved successfully');
    });
  }

  getTabSource(req, res) {
    return this._withTab(req, res, async (tabId) => {
      const result = await this.tabManager.getTabSource(tabId, { type: req.query.type || 'clean' });
      if (!result.success) return this._fail(res, 404, result.error, 'Failed to retrieve tab source');
      const data = { source: result.source };
      if (result.extractionType) data.extractionType = result.extractionType;
      this._ok(res, data, 'Tab source retrieved successfully');
    });
  }

  createTab(req, res) {
    return this._guard(res, async () => {
      const { url, silent } = req.body || {};
      if (!url) return this._fail(res, 400, 'URL is required', 'Please provide a URL to open');
      if (!TabUrl.isNavigable(url)) return this._fail(res, 400, 'Invalid URL format', 'Please provide a valid URL');
      const result = await this.tabManager.createTab(url, { silent: !!silent });
      if (!result.success) return this._fail(res, 500, result.error, 'Failed to create tab');
      this._ok(res, PlainTab.from(result.tab), 'Tab created successfully', 201);
    });
  }

  closeTab(req, res) {
    return this._withTab(req, res, async (tabId) => {
      const result = await this.tabManager.closeTab(tabId);
      this._relay(res, result, { data: null, ok: 'Tab closed successfully', failed: 'Failed to close tab' });
    });
  }

  activateTab(req, res) {
    return this._withTab(req, res, async (tabId) => {
      const result = await this.tabManager.updateTab(tabId, { type: 'activate' });
      this._relay(res, result, { ok: 'Tab activated', failed: 'Failed to activate tab', failedStatus: 400 });
    });
  }

  updateTab(req, res) {
    return this._withTab(req, res, async (tabId) => {
      const parsed = BrowserRequestParser.updateAction(req.body || {});
      if (parsed.error) return this._fail(res, 400, parsed.error, parsed.message);
      const result = await this.tabManager.updateTab(tabId, parsed.action);
      this._relay(res, result, { ok: `Tab ${parsed.action.type} completed successfully`, failed: 'Failed to update tab' });
    });
  }

  screenshotTab(req, res) {
    return this._withTab(req, res, async (tabId) => {
      const result = await this.tabManager.screenshotTab(tabId, BrowserRequestParser.screenshotOptions(req.query));
      this._relay(res, result, { ok: 'Screenshot captured successfully', failed: 'Failed to capture screenshot' });
    });
  }

  getConsoleLogs(req, res) {
    return this._withTab(req, res, async (tabId) => {
      const result = await this.tabManager.getConsoleLogs(tabId, BrowserRequestParser.consoleOptions(req.query));
      this._relay(res, result, { ok: 'Console logs retrieved successfully', failed: 'Failed to retrieve console logs' });
    });
  }

  clickAt(req, res) {
    return this._withTab(req, res, async (tabId) => {
      const { x, y, button, clickCount } = req.body || {};
      const result = await this.tabManager.clickAt(tabId, { x, y, button, clickCount });
      if (!result.success) return this._fail(res, 400, result.error, 'Failed to click at point');
      this._ok(res, NavigationStamp.apply({ ...result.data }, result), 'Clicked at point');
    });
  }

  clickElement(req, res) {
    return this._withTab(req, res, async (tabId) => {
      const { selector, text, llmFallback } = req.body || {};
      if (!selector && !llmFallback) return this._fail(res, 400, ...BrowserController.SELECTOR_REQUIRED);
      await this._fallbackAction(res, { tabId, action: 'click', selector, description: llmFallback },
        (s) => this.tabManager.clickElement(tabId, { selector: s, text }));
    });
  }

  fillForm(req, res) {
    return this._withTab(req, res, async (tabId) => {
      const { fields, llmFallback } = req.body || {};
      if (!Array.isArray(fields) || fields.length === 0) {
        return this._fail(res, 400, 'fields array is required', 'Provide an array of {selector, value} pairs');
      }
      const outcome = await SelectorFallback.run(this._fillSpec(tabId, fields, llmFallback));
      this._replyOutcome(res, outcome, 'fill');
    });
  }

  waitForElement(req, res) {
    return this._withTab(req, res, async (tabId) => {
      const { selector, text, state, timeout, llmFallback } = req.body || {};
      if (!selector && !llmFallback) return this._fail(res, 400, ...BrowserController.SELECTOR_REQUIRED);
      await this._fallbackAction(res, { tabId, action: 'wait', selector, description: llmFallback },
        (s) => this.tabManager.waitForElement(tabId, { selector: s, text, state, timeout }));
    });
  }

  getNetworkLog(req, res) {
    return this._withTab(req, res, async (tabId) => {
      const logs = NetworkLogQuery.read(this.networkInterceptor, tabId, req.query.url || null);
      if (!logs) return this._fail(res, 500, NetworkLogQuery.UNAVAILABLE, 'Network logging is not enabled');
      this._ok(res, logs, 'Network log retrieved successfully');
    });
  }

  scrollPage(req, res) {
    return this._withTab(req, res, async (tabId) => {
      const { selector, direction, amount, llmFallback } = req.body || {};
      await this._fallbackAction(res, { tabId, action: 'scroll', selector, description: llmFallback, needsSelector: true },
        (s) => this.tabManager.scrollPage(tabId, { selector: s, direction, amount }));
    });
  }

  getTable(req, res) {
    return this._withTab(req, res, async (tabId) => {
      const options = BrowserRequestParser.tableOptions(req.query);
      await this._fallbackAction(res, { tabId, action: 'get-table', selector: options.selector, description: req.query.llmFallback, needsSelector: true },
        (s) => this.tabManager.getTable(tabId, { ...options, selector: s }),
        () => this.tabManager.getTable(tabId, options));
    });
  }

  pressKey(req, res) {
    return this._withTab(req, res, async (tabId) => {
      const { key, selector, llmFallback } = req.body || {};
      if (!key) return this._fail(res, 400, 'key is required', 'Please provide a key name');
      await this._fallbackAction(res, { tabId, action: 'press-key', selector, description: llmFallback, needsSelector: true },
        (s) => this.tabManager.pressKey(tabId, { key, selector: s }));
    });
  }

  handleDialog(req, res) {
    return this._withTab(req, res, async (tabId) => {
      const { action, promptText } = req.body || {};
      const result = await this.tabManager.handleDialog(tabId, { action, promptText });
      this._relay(res, result, { ok: 'Dialog handler installed', failed: 'Failed to handle dialog' });
    });
  }

  getElement(req, res) {
    return this._withTab(req, res, async (tabId) => {
      const { selector, text, llmFallback } = req.query;
      if (!selector && !llmFallback) return this._fail(res, 400, ...BrowserController.SELECTOR_REQUIRED);
      await this._fallbackAction(res, { tabId, action: 'get-element', selector, description: llmFallback },
        (s) => this.tabManager.getElement(tabId, { selector: s, text }));
    });
  }

  extractData(req, res) {
    return this._withTab(req, res, async (tabId) => {
      const { baseSelector, childSelectors } = req.body || {};
      if (!baseSelector || !childSelectors || typeof childSelectors !== 'object') {
        return this._fail(res, 400, 'baseSelector and childSelectors are required', 'Please provide both parameters');
      }
      const result = await this.tabManager.extractData(tabId, { baseSelector, childSelectors });
      this._relay(res, result, { ok: `Extracted ${result.rowCount} items`, failed: 'Failed to extract data' });
    });
  }

  async _fallbackAction(res, { tabId, action, selector, description, needsSelector = false }, attempt, primary = () => attempt(selector)) {
    const outcome = await SelectorFallback.run({
      service: this.llmFallbackService, tabId, action, selector, description, needsSelector, primary, retry: attempt,
    });
    this._replyOutcome(res, outcome, action);
  }

  _fillSpec(tabId, fields, description) {
    return {
      service: this.llmFallbackService, tabId, action: 'fill', description, primaryFirst: true,
      selector: fields.map((f) => f.selector || f.label).join(', '),
      primary: () => this.tabManager.fillForm(tabId, { fields }),
      retry: async () => this.tabManager.fillForm(tabId, { fields: await FormFieldResolver.resolve(this.llmFallbackService, tabId, fields) }),
    };
  }

  _replyOutcome(res, outcome, action) {
    const { status, response } = RestFallbackReply.build(outcome, BrowserController.FALLBACK_REPLIES[action]);
    res.status(status).json(response.toJSON());
  }

  _relay(res, result, { ok, failed, failedStatus = 404, data }) {
    if (!result.success) return this._fail(res, failedStatus, result.error, failed);
    this._ok(res, data === undefined ? result.data : data, ok);
  }

  _withTab(req, res, handle) {
    return this._guard(res, async () => {
      const tabId = BrowserRequestParser.tabId(req.params.id);
      if (tabId == null) return this._fail(res, 400, 'Invalid tab ID', 'Tab ID must be a number');
      await handle(tabId);
    });
  }

  async _guard(res, handle) {
    try {
      await handle();
    } catch (error) {
      this._fail(res, 500, error.message, 'Internal server error');
    }
  }

  _ok(res, data, message, status = 200) {
    res.status(status).json(ApiResponse.success(data, message).toJSON());
  }

  _fail(res, status, error, message) {
    res.status(status).json(ApiResponse.error(error, message).toJSON());
  }
}

module.exports = BrowserController;
