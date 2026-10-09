const MergedSourceTable = require('./MergedSourceTable');

class ExtensionGroupBuilder {
  static groupsFor(extTools) {
    const out = [];
    const merged = new Map();
    for (const tool of (Array.isArray(extTools) ? extTools : [])) {
      const spec = MergedSourceTable.forSource(tool.source);
      if (spec) ExtensionGroupBuilder._addToMerged(merged, out, tool, spec);
      else out.push(ExtensionGroupBuilder._singleToolGroup(tool));
    }
    ExtensionGroupBuilder._finishMerged(merged);
    return out;
  }

  static toolDoc(tool) {
    return 'EXTENSION TOOL (provided by an installed extension; call it like the '
      + 'browser tools, one per message, via a ```tool JSON block):\n'
      + `- ${tool.name}: ${tool.description || 'extension tool'} Params: { ${ExtensionGroupBuilder._paramList(tool)} }`;
  }

  static _singleToolGroup(tool) {
    return {
      key: tool.name,
      label: tool.name,
      tools: [tool.name],
      stub: `${tool.description || 'extension tool'} (${tool.name}).`,
      doc: ExtensionGroupBuilder.toolDoc(tool),
      isExtension: true,
    };
  }

  static _addToMerged(merged, out, tool, spec) {
    let entry = merged.get(tool.source);
    if (!entry) {
      entry = { group: { key: spec.key, label: spec.label, tools: [], stub: spec.stub, doc: '', isExtension: true }, docs: [] };
      merged.set(tool.source, entry);
      out.push(entry.group);
    }
    entry.group.tools.push(tool.name);
    entry.docs.push(ExtensionGroupBuilder.toolDoc(tool));
  }

  static _finishMerged(merged) {
    for (const { group, docs } of merged.values()) group.doc = docs.join('\n\n');
  }

  static _paramList(tool) {
    const schema = tool.inputSchema || {};
    const required = new Set(schema.required || []);
    return Object.entries(schema.properties || {}).map(([name, def]) => {
      const type = (def && def.type) || 'string';
      const optional = required.has(name) ? '' : '?';
      const description = def && def.description ? ` (${def.description})` : '';
      return `"${name}": ${type}${optional}${description}`;
    }).join(', ');
  }
}

module.exports = ExtensionGroupBuilder;
