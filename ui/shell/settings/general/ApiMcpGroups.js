export default class ApiMcpGroups {
  static API_PREFIX = 'api:';

  static MCP_PREFIX = 'mcp:';

  static build(data, activeExtIds, extNames) {
    const disabledApi = new Set(Array.isArray(data.disabledApiGroups) ? data.disabledApiGroups : []);
    const disabledMcp = new Set(Array.isArray(data.disabledMcpTools) ? data.disabledMcpTools : []);
    const on = new Set();
    const groups = [];
    for (const [source, { api, mcp }] of ApiMcpGroups._bySource(data, activeExtIds)) {
      groups.push(ApiMcpGroups._group(source, api, mcp, { disabledApi, disabledMcp, on, extNames }));
    }
    groups.sort(ApiMcpGroups._compare);
    return { groups, on };
  }

  static disabled(groups, on) {
    const disabledApiGroups = [];
    const disabledMcpTools = [];
    for (const g of groups) for (const t of (g.tools || [])) {
      if (t.locked || on.has(t.name)) continue;
      if (t.name.startsWith(ApiMcpGroups.API_PREFIX)) disabledApiGroups.push(t.name.slice(ApiMcpGroups.API_PREFIX.length));
      else if (t.name.startsWith(ApiMcpGroups.MCP_PREFIX)) disabledMcpTools.push(t.name.slice(ApiMcpGroups.MCP_PREFIX.length));
    }
    return { disabledApiGroups, disabledMcpTools };
  }

  static sourceLabel(source, extNames) {
    if (source.startsWith('ext.')) {
      const id = source.slice(4);
      return (extNames && extNames.get(id)) || id;
    }
    const tail = source.startsWith('core.') ? source.slice(5) : source;
    return tail.split(/[-_\s]+/).filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  static visible(source, activeExtIds) {
    if (!source.startsWith('ext.')) return true;
    if (!activeExtIds) return true;
    return activeExtIds.has(source.slice(4));
  }

  static _bySource(data, activeExtIds) {
    const bySource = new Map();
    const ensure = (source) => {
      if (!bySource.has(source)) bySource.set(source, { api: null, mcp: [] });
      return bySource.get(source);
    };
    for (const g of (Array.isArray(data.apiGroups) ? data.apiGroups : [])) {
      if (ApiMcpGroups.visible(g.id, activeExtIds)) ensure(g.id).api = g;
    }
    for (const t of (Array.isArray(data.mcpTools) ? data.mcpTools : [])) {
      if (ApiMcpGroups.visible(t.source, activeExtIds)) ensure(t.source).mcp.push(t);
    }
    return bySource;
  }

  static _group(source, api, mcp, { disabledApi, disabledMcp, on, extNames }) {
    const tools = [];
    const parts = [];
    if (api) {
      const locked = api.source === 'core';
      const name = ApiMcpGroups.API_PREFIX + api.id;
      tools.push({ name, label: 'REST routes', hint: api.prefix, locked });
      if (locked || !disabledApi.has(api.id)) on.add(name);
      parts.push(`REST ${api.prefix}`);
    }
    for (const t of mcp) {
      const name = ApiMcpGroups.MCP_PREFIX + t.name;
      tools.push({ name, label: t.name, hint: t.description || '' });
      if (!disabledMcp.has(t.name)) on.add(name);
    }
    if (mcp.length) parts.push(`${mcp.length} MCP tool${mcp.length === 1 ? '' : 's'}`);
    return {
      id: source,
      label: ApiMcpGroups.sourceLabel(source, extNames),
      description: parts.join(' / '),
      tools,
      _core: !source.startsWith('ext.'),
    };
  }

  static _compare(a, b) {
    if (a._core !== b._core) return a._core ? -1 : 1;
    if (a.id === 'core.browser') return -1;
    if (b.id === 'core.browser') return 1;
    return a.label.localeCompare(b.label);
  }
}
