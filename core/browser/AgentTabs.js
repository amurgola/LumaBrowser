class AgentTabs {
  static INLINE_IMAGE = /^data:/i;

  static fetchOptions(request = {}) {
    return { includeSilent: AgentTabs._wants(request.includeSilent) || AgentTabs._wants(request.includeHidden) };
  }

  static select(tabs, request = {}) {
    const silent = AgentTabs._wants(request.includeSilent);
    const hidden = AgentTabs._wants(request.includeHidden);
    return (tabs || [])
      .filter((tab) => (hidden || !tab.hidden) && (silent || !tab.silent))
      .map(AgentTabs.shape);
  }

  static shape(tab) {
    if (!tab || typeof tab.favicon !== 'string' || !AgentTabs.INLINE_IMAGE.test(tab.favicon)) return tab;
    return { ...tab, favicon: null };
  }

  static _wants(flag) {
    return flag === true || flag === 'true';
  }
}

module.exports = AgentTabs;
