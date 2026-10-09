class ToolRecordView {
  static listRow(tool, configStore) {
    return {
      name: tool.name,
      label: tool.label,
      description: tool.description,
      status: tool.status,
      version: tool.version,
      allowedHosts: tool.allowedHosts || [],
      configSlots: tool.configSlots || [],
      config: configStore.status(tool.name, tool.configSlots || []),
      lastTest: ToolRecordView._lastTest(tool),
      updatedAt: tool.updatedAt,
    };
  }

  static editorRecord(tool, configStore) {
    return {
      name: tool.name,
      label: tool.label,
      description: tool.description,
      inputSchema: tool.inputSchema || { type: 'object', properties: {} },
      configSlots: tool.configSlots || [],
      allowedHosts: tool.allowedHosts || [],
      code: tool.code || '',
      status: tool.status,
      version: tool.version,
      lastTest: ToolRecordView._lastTest(tool),
      config: configStore.status(tool.name, tool.configSlots || []),
    };
  }

  static _lastTest(tool) {
    return tool.lastTest ? { ok: tool.lastTest.ok, at: tool.lastTest.at } : null;
  }
}

module.exports = ToolRecordView;
