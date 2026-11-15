class BrowserTabContext {
  static TERMINAL_ID = /^t\d+$/;
  static MAX_TITLE = 200;
  static PREAMBLE = 'The developer is working in a terminal docked under a browser tab in LumaBrowser, and that tab is your working tab: "this page", "the page" or "this tab" means it, and "go to" a site means navigate it there. Use the browser tools (navigate, observe_page, click, type, get_source...) on it; they act on the working tab unless given another tabId.';

  static terminalId(value) {
    const id = value == null ? '' : String(value).trim();
    return BrowserTabContext.TERMINAL_ID.test(id) ? id : null;
  }

  static tabFor(terminalId, terminal) {
    if (!terminalId || !terminal || typeof terminal.tabBeside !== 'function') return null;
    try { return terminal.tabBeside(terminalId) || null; } catch (_) { return null; }
  }

  static render(tab) {
    if (!tab) return '';
    const title = BrowserTabContext._attribute(String(tab.title || '').slice(0, BrowserTabContext.MAX_TITLE));
    const line = `<tab role="working-tab" tabId="${Number(tab.id)}" title="${title}" url="${BrowserTabContext._attribute(tab.url)}" />`;
    return `<browser_context>\n${BrowserTabContext.PREAMBLE}\n${line}\n</browser_context>`;
  }

  static _attribute(text) {
    return String(text || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/[\r\n]+/g, ' ');
  }
}

module.exports = BrowserTabContext;
