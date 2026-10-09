const BrowserActions = require('../browser/BrowserActions');
const ExtensionDisplayName = require('./tools/ExtensionDisplayName');

class AgentToolCatalog {
  static BASE_TOOL_GROUPS = [
    {
      id: 'browse',
      label: 'Web browsing & automation',
      description: 'Open pages, click, fill forms, read/extract page content, screenshot.',
      tools: BrowserActions.chatToolEntries(),
    },
    {
      id: 'artifacts',
      label: 'Artifacts & code',
      description: 'Create/edit side-panel artifacts (code, HTML, SVG, Markdown), build live interactive modules, and lint code.',
      tools: [
        { name: 'create_artifact', label: 'Create artifact' },
        { name: 'edit_artifact', label: 'Edit artifact' },
        { name: 'create_live_artifact', label: 'Create live (interactive) artifact' },
        { name: 'validate_code', label: 'Validate code' },
      ],
    },
    {
      id: 'images',
      label: 'Image generation',
      description: 'Generate and edit images with the host’s local image server.',
      tools: [
        { name: 'generate_image', label: 'Generate image' },
        { name: 'edit_image', label: 'Edit image' },
      ],
    },
    {
      id: 'video',
      label: 'Video generation',
      description: 'Generate short video clips, or animate an existing image, with the host’s local video server.',
      tools: [
        { name: 'generate_video', label: 'Generate video' },
        { name: 'animate_image', label: 'Animate image into video' },
      ],
    },
    {
      id: 'music',
      label: 'Music generation',
      description: 'Compose full songs with vocals from lyrics and a style description, with the host’s local music server.',
      tools: [{ name: 'generate_music', label: 'Generate music' }],
    },
    {
      id: 'web',
      label: 'Web',
      description: 'Search the live web or read a page as Markdown, without opening a browser tab (SSRF-hardened, read-only).',
      tools: [{ name: 'web_search', label: 'Web search / fetch' }],
    },
    {
      id: 'knowledge_base',
      label: 'Knowledge base',
      description: "Search the user's uploaded documents (PDFs, notes, pages) for relevant passages.",
      tools: [{ name: 'search_knowledge_base', label: 'Search knowledge base' }],
    },
    {
      id: 'programmatic',
      label: 'Programmatic',
      description: 'Outbound calls to other systems: webhooks and push notifications. Off by default; enable to let the agent deliver data out.',
      tools: [{ name: 'send_webhook', label: 'Send webhook (HTTP POST)' }],
    },
  ];

  static BASE_TOOL_NAMES = AgentToolCatalog.BASE_TOOL_GROUPS.flatMap((group) => group.tools.map((tool) => tool.name));

  static PROGRAMMATIC_TOOL_NAMES = ['send_webhook', 'send_notification_ntfy'];

  static FORGE_TOOL_NAMES = ['create_tool', 'test_tool', 'publish_tool'];
  static FORGE_TOOL_LABELS = {
    create_tool: 'Create custom tool',
    test_tool: 'Test custom tool draft',
    publish_tool: 'Publish custom tool',
  };

  static USER_TOOLS_SOURCE = 'ext.user-tools';
  static USER_TOOLS_GROUP = {
    id: 'user_created_tools',
    label: 'User created tools',
    description: 'Tools you built with the tool forge. Each runs sandboxed with only the network access it declared. Enabled when published; toggle per tool.',
  };

  static MIRROR_SOURCES = new Set(['core.browser']);

  static DISABLED_TOOLS_KEY = 'core.chat.disabledAgentTools';
  static SEEDED_TOOLS_KEY = 'core.chat.defaultOffToolsSeeded';

  static getDynamicTools(mcpAggregator) {
    if (!mcpAggregator || typeof mcpAggregator.getRegisteredTools !== 'function') return [];
    const definitions = AgentToolCatalog._toolDefinitions(mcpAggregator);
    const byName = new Map();
    for (const tool of mcpAggregator.getRegisteredTools()) {
      if (AgentToolCatalog._isDynamic(tool) && !byName.has(tool.name)) {
        byName.set(tool.name, AgentToolCatalog._dynamicEntry(tool, definitions.get(tool.name)));
      }
    }
    return [...byName.values()];
  }

  static getToolGroups(mcpAggregator) {
    const groups = AgentToolCatalog._copyBaseGroups();
    const bySource = new Map();
    for (const tool of AgentToolCatalog.getDynamicTools(mcpAggregator)) {
      if (!AgentToolCatalog._routeIntoBaseGroup(groups, tool)) AgentToolCatalog._addToSource(bySource, tool);
    }
    for (const [source, tools] of bySource) groups.push(AgentToolCatalog._sourceGroup(source, tools));
    return groups;
  }

  static getAllToolNames(mcpAggregator) {
    return AgentToolCatalog.getToolGroups(mcpAggregator).flatMap((group) => group.tools.map((tool) => tool.name));
  }

  static seedDefaultOffAgentTools(settingsDb, names = AgentToolCatalog.PROGRAMMATIC_TOOL_NAMES) {
    const seeded = settingsDb.get(AgentToolCatalog.SEEDED_TOOLS_KEY, []);
    const missing = names.filter((name) => !seeded.includes(name));
    if (!missing.length) return false;
    const current = settingsDb.get(AgentToolCatalog.DISABLED_TOOLS_KEY, []);
    settingsDb.set(AgentToolCatalog.DISABLED_TOOLS_KEY, [...new Set([...(Array.isArray(current) ? current : []), ...missing])]);
    settingsDb.set(AgentToolCatalog.SEEDED_TOOLS_KEY, [...seeded, ...missing]);
    return true;
  }

  static _toolDefinitions(mcpAggregator) {
    return typeof mcpAggregator.getToolDefinitions === 'function' ? mcpAggregator.getToolDefinitions() : new Map();
  }

  static _isDynamic(tool) {
    if (!tool || !tool.name) return false;
    return !AgentToolCatalog.BASE_TOOL_NAMES.includes(tool.name) && !AgentToolCatalog.MIRROR_SOURCES.has(tool.source);
  }

  static _dynamicEntry(tool, definition) {
    return {
      name: tool.name,
      description: tool.description || '',
      inputSchema: tool.inputSchema || { type: 'object', properties: {} },
      source: tool.source || 'mcp',
      mutating: !!(definition && definition.mutating === true),
    };
  }

  static _copyBaseGroups() {
    return AgentToolCatalog.BASE_TOOL_GROUPS.map((group) => ({ ...group, tools: group.tools.map((tool) => ({ ...tool })) }));
  }

  static _routeIntoBaseGroup(groups, tool) {
    if (AgentToolCatalog.PROGRAMMATIC_TOOL_NAMES.includes(tool.name)) {
      AgentToolCatalog._group(groups, 'programmatic').tools.push({ name: tool.name, label: tool.name });
      return true;
    }
    if (AgentToolCatalog.FORGE_TOOL_NAMES.includes(tool.name)) {
      const label = AgentToolCatalog.FORGE_TOOL_LABELS[tool.name] || tool.name;
      AgentToolCatalog._group(groups, 'artifacts').tools.push({ name: tool.name, label, surfaceWhenDisabled: true });
      return true;
    }
    return false;
  }

  static _addToSource(bySource, tool) {
    if (!bySource.has(tool.source)) bySource.set(tool.source, []);
    bySource.get(tool.source).push({ name: tool.name, label: tool.name });
  }

  static _sourceGroup(source, tools) {
    if (source === AgentToolCatalog.USER_TOOLS_SOURCE) {
      return { ...AgentToolCatalog.USER_TOOLS_GROUP, tools: tools.map((tool) => ({ ...tool, surfaceWhenDisabled: true })) };
    }
    return { id: source, label: ExtensionDisplayName.forSource(source), description: '', tools };
  }

  static _group(groups, id) {
    return groups.find((group) => group.id === id);
  }
}

module.exports = AgentToolCatalog;
