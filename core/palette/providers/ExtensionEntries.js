class ExtensionEntries {
  static fromList(rows) {
    const out = [];
    for (const row of rows || []) {
      if (!row || !row.id || !row.enabled || row.debugOnly) continue;
      out.push(ExtensionEntries._main(row));
      if (row.setupTab) out.push(ExtensionEntries._setup(row));
    }
    return out;
  }

  static _main(row) {
    const ownTab = row.settings && row.settings.placement === 'tab' && row.settings.tabId;
    return {
      id: `ext.${row.id}`,
      label: row.name || row.id,
      description: row.description || `Settings for the ${row.name || row.id} extension.`,
      keywords: ['extension', 'add-on', 'plugin', row.id.replace(/-/g, ' ')],
      path: ownTab ? [row.settings.label || row.name] : ['Extensions'],
      kind: 'page',
      target: ownTab
        ? { surface: 'shell', tab: row.settings.tabId }
        : { surface: 'extension', extensionId: row.id },
    };
  }

  static _setup(row) {
    return {
      id: `ext.${row.id}.setup`,
      label: row.setupTab.label || row.name,
      description: `The ${row.setupTab.label || row.name} page of the LLM tab Setup area (from the ${row.name} extension).`,
      keywords: ['setup', 'llm tab', row.id.replace(/-/g, ' ')],
      path: [row.setupTab.label || row.name],
      kind: 'page',
      target: { surface: 'setup', page: `ext:${row.id}` },
    };
  }
}

module.exports = ExtensionEntries;
