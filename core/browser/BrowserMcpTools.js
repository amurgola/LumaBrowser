const BrowserActions = require('./BrowserActions');
const McpResult = require('../shell/McpResult');
const BrowserRequestParser = require('./controller/BrowserRequestParser');
const NavigationStamp = require('./controller/NavigationStamp');
const NetworkLogQuery = require('./controller/NetworkLogQuery');
const ExtractionReply = require('./mcp/ExtractionReply');
const FallbackToolRunner = require('./mcp/FallbackToolRunner');
const McpPayload = require('./mcp/McpPayload');
const ScreenshotReply = require('./mcp/ScreenshotReply');
const SettledTab = require('./mcp/SettledTab');

class BrowserMcpTools {
  static TOOLS = BrowserActions.mcpToolDefinitions();

  static ROUTES = {
    browser_get_tabs: '_getTabs',
    browser_create_tab: '_createTab',
    browser_close_tab: '_closeTab',
    browser_navigate: '_navigate',
    browser_refresh: '_refresh',
    browser_execute_js: '_executeJs',
    browser_get_source: '_getSource',
    browser_screenshot: '_screenshot',
    browser_click_at: '_clickAt',
    browser_get_console: '_getConsole',
    browser_get_network: '_getNetwork',
    browser_observe_page: '_observePage',
    browser_click: '_click',
    browser_locate: '_locate',
    browser_type: '_type',
    browser_fill_form: '_fillForm',
    browser_wait_for: '_waitFor',
    browser_scroll: '_scroll',
    browser_extract_data: '_extractData',
    browser_select_option: '_selectOption',
    browser_set_date: '_setDate',
    browser_set_slider: '_setSlider',
    browser_collect_list: '_collectList',
    browser_get_table: '_getTable',
    browser_press_key: '_pressKey',
    browser_get_element: '_getElement',
    browser_handle_dialog: '_handleDialog',
  };

  static TARGET_REQUIRED = 'ref, selector or llmFallback is required';
  static REF_OR_SELECTOR_REQUIRED = 'ref or selector is required';
  static SELECTOR_REQUIRED = 'selector or llmFallback is required';
  static EXTRACT_USAGE = 'baseSelector and childSelectors are required';
  static COLLECT_USAGE = 'itemSelector is required';

  constructor(browserService, llmFallbackService, networkInterceptor) {
    this._service = browserService;
    this._networkInterceptor = networkInterceptor || null;
    this._fallback = new FallbackToolRunner(browserService, llmFallbackService);
  }

  static createDirectHandler(browserService, llmFallbackService, networkInterceptor) {
    return new BrowserMcpTools(browserService, llmFallbackService, networkInterceptor).handler();
  }

  handler() {
    return (toolName, args) => this.handle(toolName, args);
  }

  async handle(toolName, args = {}) {
    const route = BrowserMcpTools.ROUTES[toolName];
    if (!route) return McpResult.error(`Unknown core browser tool: ${toolName}`);
    try {
      return await this[route](args || {});
    } catch (error) {
      return McpResult.error(error.message || 'Internal error');
    }
  }

  async _getTabs(args) {
    const result = await this._service.getTabs({ includeSilent: args.includeSilent });
    return this._reply(result, 'Failed to get tabs', result.tabs || []);
  }

  async _createTab(args) {
    if (!args.url) return McpResult.error('URL is required');
    const result = await this._service.createTab(args.url, { silent: !!args.silent });
    if (!result.success) return McpResult.error(result.error || 'Failed to create tab');
    const data = await SettledTab.read(this._service, result.tab);
    return McpResult.text({ success: true, data });
  }

  _closeTab(args) {
    return this._withTab(args, async (tabId) => {
      const result = await this._service.closeTab(tabId);
      if (!result.success) return McpResult.error(result.error || 'Failed to close tab');
      return McpResult.text({ success: true });
    });
  }

  _navigate(args) {
    return this._withTab(args, async (tabId) => {
      if (!args.url) return McpResult.error('URL is required');
      return this._reply(await this._service.navigate(tabId, args.url), 'Failed to navigate');
    });
  }

  _refresh(args) {
    return this._withTab(args, async (tabId) => this._reply(await this._service.refresh(tabId), 'Failed to refresh'));
  }

  _executeJs(args) {
    return this._withTab(args, async (tabId) => {
      if (!args.script) return McpResult.error('Script is required');
      return this._reply(await this._service.executeJs(tabId, args.script), 'Failed to execute script');
    });
  }

  _getSource(args) {
    return this._withTab(args, async (tabId) => this._reply(await this._service.getSource(tabId, { type: args.type || 'clean' }), 'Failed to get source'));
  }

  _screenshot(args) {
    return this._withTab(args, async (tabId) => {
      const fullPage = !!args.fullPage;
      const result = await this._service.screenshot(tabId, {
        fullPage: args.fullPage,
        cssScale: !args.fullPage && args.fullResolution !== true,
        marks: !args.fullPage && args.marks === true,
      });
      if (!result.success) return McpResult.error(result.error || 'Failed to take screenshot');
      return ScreenshotReply.build(result.data, fullPage) || McpResult.text({ success: true, data: result.data });
    });
  }

  _clickAt(args) {
    return this._withTab(args, async (tabId) => {
      if (args.x == null || args.y == null) return McpResult.error('x and y are required');
      const result = await this._service.clickAt(tabId, { x: args.x, y: args.y, button: args.button, clickCount: args.clickCount });
      if (!result.success) return McpResult.error(result.error || 'Failed to click at point');
      return McpResult.text({ success: true, data: NavigationStamp.apply(McpPayload.data(result), result) });
    });
  }

  _getConsole(args) {
    return this._withTab(args, async (tabId) => this._reply(await this._service.getConsoleLogs(tabId, { level: args.level }), 'Failed to get console logs'));
  }

  _getNetwork(args) {
    return this._withTab(args, async (tabId) => {
      const logs = NetworkLogQuery.read(this._networkInterceptor, tabId, args.url);
      if (!logs) return McpResult.error(NetworkLogQuery.UNAVAILABLE);
      return McpResult.text({ success: true, data: logs });
    });
  }

  _observePage(args) {
    return this._withTab(args, async (tabId) => this._reply(await this._service.observePage(tabId), 'Failed to observe page'));
  }

  _click(args) {
    return this._withTab(args, async (tabId) => {
      if (!args.selector && args.ref == null && !args.llmFallback) return McpResult.error(BrowserMcpTools.TARGET_REQUIRED);
      return this._fallback.run({
        tabId, args, action: 'click', method: 'click',
        fallbackNeedsSelector: args.ref != null,
        visualFallback: true,
        buildOpts: (a) => ({ selector: a.selector, text: a.text, ref: a.ref }),
        buildRetryOpts: (a) => ({ selector: a.selector, text: a.text }),
      });
    });
  }

  _locate(args) {
    return this._withTab(args, async (tabId) => {
      if (!args.description) return McpResult.error('description is required');
      const result = await this._service.locate(tabId, {
        description: args.description, click: args.click === true, zoom: args.zoom === true,
        button: args.button, clickCount: args.clickCount,
      });
      if (!result.success) return McpResult.error(result.error || 'Could not locate the element');
      return McpResult.text({ success: true, data: NavigationStamp.apply(McpPayload.data(result), result) });
    });
  }

  _type(args) {
    return this._withTab(args, async (tabId) => {
      if (typeof args.text !== 'string') return McpResult.error('text is required');
      if (!args.selector && args.ref == null && !args.llmFallback) return McpResult.error(BrowserMcpTools.TARGET_REQUIRED);
      return this._fallback.run({
        tabId, args, action: 'type', method: 'typeInto',
        fallbackNeedsSelector: args.ref != null,
        buildOpts: (a) => ({ ref: a.ref, selector: a.selector, text: a.text, submit: a.submit, clear: a.clear }),
        buildRetryOpts: (a) => ({ selector: a.selector, text: a.text, submit: a.submit, clear: a.clear }),
      });
    });
  }

  _fillForm(args) {
    return this._withTab(args, async (tabId) => {
      if (!args.fields) return McpResult.error('fields array is required');
      return this._fallback.run({
        tabId, args, action: 'fill', method: 'fill', fallbackKey: null,
        buildOpts: (a) => ({ fields: a.fields, llmFallback: a.llmFallback }),
      });
    });
  }

  _waitFor(args) {
    return this._withTab(args, async (tabId) => {
      if (!args.selector && !args.llmFallback) return McpResult.error(BrowserMcpTools.SELECTOR_REQUIRED);
      return this._fallback.run({
        tabId, args, action: 'wait', method: 'waitFor',
        buildOpts: (a) => ({ selector: a.selector, text: a.text, state: a.state || 'visible', timeout: a.timeout || 5000 }),
      });
    });
  }

  _scroll(args) {
    return this._withTab(args, async (tabId) => this._fallback.run({
      tabId, args, action: 'scroll', method: 'scroll', fallbackNeedsSelector: true,
      buildOpts: (a) => ({ selector: a.selector, direction: a.direction || 'down', amount: a.amount || 600 }),
    }));
  }

  _extractData(args) {
    return this._withTab(args, async (tabId) => {
      const { baseSelector, childSelectors } = args;
      if (!baseSelector || !childSelectors) return McpResult.error(BrowserMcpTools.EXTRACT_USAGE);
      const result = await this._service.extractData(tabId, { baseSelector, childSelectors });
      if (!result.success) return McpResult.error(result.error || 'Failed to extract data');
      return McpResult.text({ success: true, data: ExtractionReply.build(baseSelector, result, childSelectors) });
    });
  }

  _selectOption(args) {
    return this._withTab(args, async (tabId) => {
      if (args.option == null || args.option === '') return McpResult.error('option is required');
      if (!args.selector && args.ref == null) return McpResult.error(BrowserMcpTools.REF_OR_SELECTOR_REQUIRED);
      const result = await this._service.selectOption(tabId, { ref: args.ref, selector: args.selector, option: args.option, multiple: args.multiple === true });
      return this._reply(result, 'Failed to select option');
    });
  }

  _setDate(args) {
    return this._withTab(args, async (tabId) => {
      if (!args.date) return McpResult.error('date is required (yyyy-mm-dd)');
      if (!args.selector && args.ref == null) return McpResult.error(BrowserMcpTools.REF_OR_SELECTOR_REQUIRED);
      return this._reply(await this._service.setDate(tabId, { ref: args.ref, selector: args.selector, date: args.date }), 'Failed to set date');
    });
  }

  _setSlider(args) {
    return this._withTab(args, async (tabId) => {
      if (args.value == null || args.value === '') return McpResult.error('value is required');
      if (!args.selector && args.ref == null) return McpResult.error(BrowserMcpTools.REF_OR_SELECTOR_REQUIRED);
      return this._reply(await this._service.setSlider(tabId, { ref: args.ref, selector: args.selector, value: args.value }), 'Failed to set slider');
    });
  }

  _collectList(args) {
    return this._withTab(args, async (tabId) => {
      const itemSelector = args.itemSelector || args.baseSelector;
      if (!itemSelector) return McpResult.error(BrowserMcpTools.COLLECT_USAGE);
      const opts = { itemSelector, childSelectors: args.childSelectors, maxItems: args.maxItems, maxScrolls: args.maxScrolls };
      const result = await this._service.collectList(tabId, opts);
      if (!result.success) return McpResult.error(result.error || 'Failed to collect list');
      return McpResult.text({ success: true, data: { itemSelector, ...McpPayload.data(result) } });
    });
  }

  _getTable(args) {
    return this._withTab(args, async (tabId) => this._fallback.run({
      tabId, args, action: 'getTable', method: 'getTable',
      buildOpts: (a) => ({ selector: a.selector || 'table', rowSelector: a.rowSelector, cellSelector: a.cellSelector }),
    }));
  }

  _pressKey(args) {
    return this._withTab(args, async (tabId) => {
      if (!args.key) return McpResult.error('key is required');
      return this._fallback.run({
        tabId, args, action: 'pressKey', method: 'pressKey',
        fallbackNeedsSelector: args.ref != null,
        buildOpts: (a) => ({ key: a.key, selector: a.selector, ref: a.ref }),
        buildRetryOpts: (a) => ({ key: a.key, selector: a.selector }),
      });
    });
  }

  _getElement(args) {
    return this._withTab(args, async (tabId) => {
      if (!args.selector && !args.llmFallback) return McpResult.error(BrowserMcpTools.SELECTOR_REQUIRED);
      return this._fallback.run({
        tabId, args, action: 'getElement', method: 'getElement',
        buildOpts: (a) => ({ selector: a.selector, text: a.text }),
      });
    });
  }

  _handleDialog(args) {
    return this._withTab(args, async (tabId) => {
      if (!args.action) return McpResult.error('action is required (accept or dismiss)');
      return this._reply(await this._service.handleDialog(tabId, { action: args.action, promptText: args.promptText }), 'Failed to handle dialog');
    });
  }

  _withTab(args, handle) {
    const tabId = BrowserRequestParser.tabId(args.tabId);
    if (tabId == null) return McpResult.error('Invalid tab ID');
    return handle(tabId);
  }

  _reply(result, failure, data) {
    if (!result.success) return McpResult.error(result.error || failure);
    return McpResult.text({ success: true, data: data === undefined ? McpPayload.data(result) : data });
  }
}

module.exports = BrowserMcpTools;
