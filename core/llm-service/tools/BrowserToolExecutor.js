class BrowserToolExecutor {
  static DEFAULT_WAIT_TIMEOUT_MS = 5000;

  static ACTIONS = {
    navigate: (bs, tabId, p) => bs.navigate(tabId, p.url),
    create_tab: (bs, tabId, p) => bs.createTab(p.url, { silent: !!p.silent, activate: p.activate === true }),
    get_tabs: (bs, tabId, p) => BrowserToolExecutor._getTabs(bs, p),
    observe_page: (bs, tabId) => BrowserToolExecutor._observePage(bs, tabId),
    click: (bs, tabId, p) => bs.click(tabId, { selector: p.selector, text: p.text, ref: p.ref }),
    type: (bs, tabId, p) => bs.typeInto(tabId, { ref: p.ref, selector: p.selector, text: p.text, submit: p.submit, clear: p.clear }),
    fill_form: (bs, tabId, p) => bs.fill(tabId, { fields: p.fields, llmFallback: p.llmFallback }),
    press_key: (bs, tabId, p) => bs.pressKey(tabId, { key: p.key, selector: p.selector, ref: p.ref }),
    scroll: (bs, tabId, p) => bs.scroll(tabId, { selector: p.selector, direction: p.direction, amount: p.amount }),
    get_source: (bs, tabId, p) => bs.getSource(tabId, { type: p.type || 'text' }),
    screenshot: (bs, tabId, p) => bs.screenshot(tabId, { fullPage: p.fullPage, cssScale: !p.fullPage, marks: !p.fullPage && p.marks === true }),
    locate: (bs, tabId, p) => bs.locate(tabId, { description: p.description, click: p.click === true, zoom: p.zoom === true }),
    click_at: (bs, tabId, p) => bs.clickAt(tabId, { x: p.x, y: p.y, button: p.button, clickCount: BrowserToolExecutor._clickCount(p) }),
    wait_for: (bs, tabId, p) => bs.waitFor(tabId, { selector: p.selector, timeout: p.timeout || BrowserToolExecutor.DEFAULT_WAIT_TIMEOUT_MS }),
    get_element: (bs, tabId, p) => bs.getElement(tabId, { selector: p.selector, text: p.text }),
    extract_data: (bs, tabId, p) => bs.extractData(tabId, { baseSelector: p.baseSelector, childSelectors: p.childSelectors }),
    select_option: (bs, tabId, p) => bs.selectOption(tabId, { ref: p.ref, selector: p.selector, option: p.option, multiple: p.multiple === true }),
    set_date: (bs, tabId, p) => bs.setDate(tabId, { ref: p.ref, selector: p.selector, date: p.date }),
    set_slider: (bs, tabId, p) => bs.setSlider(tabId, { ref: p.ref, selector: p.selector, value: p.value }),
    collect_list: (bs, tabId, p) => bs.collectList(tabId, {
      itemSelector: p.itemSelector || p.baseSelector,
      childSelectors: p.childSelectors,
      maxItems: p.maxItems,
      maxScrolls: p.maxScrolls,
    }),
  };

  static async execute(toolName, params, browserService, defaults = {}) {
    const action = Object.hasOwn(BrowserToolExecutor.ACTIONS, toolName) ? BrowserToolExecutor.ACTIONS[toolName] : null;
    if (!action) return { success: false, error: `Unknown tool: ${toolName}` };
    const merged = { ...defaults, ...params };
    try {
      return BrowserToolExecutor._normalize(await action(browserService, merged.tabId || 0, merged));
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async _getTabs(browserService, params) {
    const result = await browserService.getTabs({ includeSilent: params.includeSilent });
    if (result.tabs && !result.data) result.data = result.tabs;
    return result;
  }

  static async _observePage(browserService, tabId) {
    const result = await browserService.observePage(tabId);
    if (result.success && result.data && result.data.text) return { success: true, message: result.data.text, count: result.data.count };
    return result;
  }

  static _clickCount(params) {
    return params.double === true || Number(params.clickCount) === 2 ? 2 : 1;
  }

  static _normalize(result) {
    if (!result || typeof result !== 'object') return { success: true, data: result };
    if (result.tab && !result.data) result.data = typeof result.tab.toJSON === 'function' ? result.tab.toJSON() : result.tab;
    return result;
  }
}

module.exports = BrowserToolExecutor;
