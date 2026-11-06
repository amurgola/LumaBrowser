const ChatToolHandler = require('./ChatToolHandler');

class VaultToolsHandler extends ChatToolHandler {
  names() {
    return ['vault_list', 'vault_fill'];
  }

  async execute(name, params, ctx) {
    const vault = ctx && ctx.deps && ctx.deps.vaultService;
    if (!vault || !vault.agent) return { success: false, error: 'The password manager is not available in this run.' };
    const caller = VaultToolsHandler.callerOf(ctx);
    const p = params || {};
    if (name === 'vault_list') {
      const listTab = p.tabId != null && Number.isFinite(Number(p.tabId)) ? Number(p.tabId) : null;
      return vault.agent.list({ tabUrl: listTab == null ? null : vault.tabUrl(listTab), caller });
    }
    const tabId = VaultToolsHandler._tabId(vault, p.tabId);
    if (tabId == null) return { success: false, error: 'No tab to fill. Pass tabId (from get_tabs) of the page with the form.' };
    return vault.agent.fill({ tabId, ref: p.ref, caller, part: p.part === 'otp' ? 'otp' : null });
  }

  static callerOf(ctx) {
    if (ctx && ctx.approvalOverride != null) return { external: true, name: 'terminal or scheduled run' };
    if (!ctx || !ctx.allowTakeover) return { external: true, name: 'shared or unattended run' };
    return { external: false };
  }

  static _tabId(vault, tabId) {
    if (tabId != null && Number.isFinite(Number(tabId))) return Number(tabId);
    return vault.activeTabId();
  }
}

module.exports = VaultToolsHandler;
