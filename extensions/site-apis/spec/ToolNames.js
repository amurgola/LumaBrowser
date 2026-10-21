class ToolNames {
  static PREFIX = 'siteapi_';

  static endpointTool(site, endpoint) {
    return `${ToolNames.PREFIX}${ToolNames.siteSegment(site)}_${endpoint.name}`;
  }

  static siteSegment(site) {
    const id = typeof site === 'string' ? site : (site && site.id) || '';
    return String(id).replace(/-/g, '_');
  }

  static isEndpointTool(name) {
    return typeof name === 'string' && name.startsWith(ToolNames.PREFIX);
  }
}

module.exports = ToolNames;
