const UserToolStore = require('./UserToolStore');

class ToolBundleCodec {
  static FORMAT = 'luma-tool';
  static VERSION = 1;
  static FALLBACK_NAME = 'imported_tool';

  constructor({ store, names }) {
    this._store = store;
    this._names = names;
  }

  exportBundle(name) {
    const tool = this._store.get(name);
    if (!tool) throw new Error(`No tool named "${name}".`);
    return { format: ToolBundleCodec.FORMAT, version: ToolBundleCodec.VERSION, exportedAt: Date.now(), tool: ToolBundleCodec._portable(tool) };
  }

  importBundle(bundle) {
    ToolBundleCodec._assertBundle(bundle);
    const source = bundle.tool;
    const name = this._names.freeName(ToolBundleCodec.toolNameFrom(source.name));
    const warnings = name === source.name ? [] : [ToolBundleCodec._renamedWarning(source.name, name)];
    const tool = this._store.upsertDraft({ ...ToolBundleCodec._draftFields(source), name, lastTest: null });
    warnings.push('Imported as a draft: test it (and fill any config) before publishing.');
    return { tool, warnings };
  }

  static toolNameFrom(raw) {
    const name = String(raw || '').trim();
    if (UserToolStore.isValidName(name)) return name;
    const coerced = name.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^[^a-z]+/, '').slice(0, 41) || ToolBundleCodec.FALLBACK_NAME;
    return UserToolStore.isValidName(coerced) ? coerced : ToolBundleCodec.FALLBACK_NAME;
  }

  static _assertBundle(bundle) {
    const valid = bundle && typeof bundle === 'object' && bundle.format === ToolBundleCodec.FORMAT
      && bundle.tool && typeof bundle.tool === 'object';
    if (!valid) throw new Error('Not a Luma tool export file.');
  }

  static _portable(tool) {
    return {
      name: tool.name,
      label: tool.label || tool.name,
      description: tool.description || '',
      inputSchema: tool.inputSchema || { type: 'object', properties: {} },
      configSlots: Array.isArray(tool.configSlots) ? tool.configSlots : [],
      allowedHosts: Array.isArray(tool.allowedHosts) ? tool.allowedHosts : [],
      code: tool.code || '',
    };
  }

  static _draftFields(source) {
    return {
      label: source.label,
      description: String(source.description || ''),
      inputSchema: source.inputSchema && typeof source.inputSchema === 'object' ? source.inputSchema : { type: 'object', properties: {} },
      configSlots: Array.isArray(source.configSlots) ? source.configSlots : [],
      allowedHosts: Array.isArray(source.allowedHosts) ? source.allowedHosts : [],
      code: String(source.code || ''),
    };
  }

  static _renamedWarning(original, name) {
    return `A tool named "${original}" already exists (or the name was invalid), so it was imported as "${name}".`;
  }
}

module.exports = ToolBundleCodec;
