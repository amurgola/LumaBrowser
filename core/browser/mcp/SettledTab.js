const McpPayload = require('./McpPayload');

class SettledTab {
  static LOAD_TIMEOUT_MS = 15000;

  static async read(browserService, tab) {
    const settled = await SettledTab._afterLoad(browserService, tab);
    return { ...settled, createdAt: McpPayload.iso(settled.createdAt), lastNavigatedAt: McpPayload.iso(settled.lastNavigatedAt) };
  }

  static async _afterLoad(browserService, tab) {
    if (!tab || typeof tab.id !== 'number') return tab;
    await browserService.waitForLoad(tab.id, SettledTab.LOAD_TIMEOUT_MS);
    const fresh = await browserService.getTabs({ includeSilent: true });
    return (fresh.tabs || []).find((t) => t.id === tab.id) || tab;
  }
}

module.exports = SettledTab;
