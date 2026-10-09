const BrowserTools = require('../../llm-service/BrowserTools');
const ToolSchemas = require('./ToolSchemas');

class ToolRequiredArgs {
  static GLOBAL_ALIASES = {
    artifactId: ['artifact_id', 'id', 'imageId'],
  };

  static TOOL_ALIASES = {
    create_live_artifact: { html: ['js', 'content'] },
    activate_tools: { groups: ['group', 'tools'] },
    collect_list: { itemSelector: ['baseSelector'] },
  };

  static SOFT_REQUIRED = {
    create_artifact: ['type'],
  };

  static _pseudoIndex = null;

  constructor(extTools = []) {
    this._index = new Map(ToolRequiredArgs._pseudoEntries());
    this._indexBrowserTools();
    this._indexExtensionTools(extTools);
  }

  entry(name) {
    return this._index.get(name) || null;
  }

  missing(name, params) {
    return this._classify(name, params).hard;
  }

  softMissing(name, params) {
    return this._classify(name, params).soft;
  }

  refusal(name, params) {
    const missing = this.missing(name, params);
    if (!missing.length) return null;
    return { success: false, error: this.missingArgumentsMessage(name, missing, params), missingArgs: missing };
  }

  withSoftMissingNote(result, name, params) {
    const soft = this.softMissing(name, params);
    if (!soft.length || !result || typeof result !== 'object') return result;
    const note = this._softMissingNote(name, soft);
    if (typeof result.message === 'string' && result.message) result.message += `\n\n${note}`;
    else if (typeof result.error === 'string' && result.error) result.error += `\n\n${note}`;
    else result.message = note;
    return result;
  }

  missingArgumentsMessage(name, missing, params) {
    const properties = this._propertiesOf(name);
    const lines = missing.map((key) => {
      const described = ToolRequiredArgs._describe(properties, key);
      return described ? `  - "${key}": ${described}` : `  - "${key}"`;
    });
    const received = ToolRequiredArgs._receivedKeys(params);
    const receivedLine = received.length
      ? `Arguments received: ${received.map((k) => `"${k}"`).join(', ')}.`
      : 'No arguments were received at all.';
    const plural = missing.length > 1;
    return `${name} was NOT run: required argument${plural ? 's are' : ' is'} missing.\n`
      + `Missing:\n${lines.join('\n')}\n${receivedLine}\n`
      + `Re-issue the call with ${plural ? 'these fields' : 'this field'} filled in.`
      + (received.length ? '' : ToolRequiredArgs._fenceHint(name));
  }

  static _pseudoEntries() {
    if (ToolRequiredArgs._pseudoIndex) return ToolRequiredArgs._pseudoIndex;
    const index = new Map();
    for (const schema of [...ToolSchemas.pseudoToolSchemas(() => true), ToolSchemas.activateToolSchema()]) {
      const fn = schema && schema.function;
      if (!fn || !fn.name) continue;
      const parameters = fn.parameters || {};
      index.set(fn.name, { required: parameters.required || [], properties: parameters.properties || {} });
    }
    ToolRequiredArgs._pseudoIndex = index;
    return index;
  }

  _indexBrowserTools() {
    for (const tool of BrowserTools.TOOL_DEFINITIONS) {
      if (Array.isArray(tool.required) && tool.required.length) {
        this._index.set(tool.name, { required: tool.required, properties: tool.params || {} });
      }
    }
  }

  _indexExtensionTools(extTools) {
    for (const tool of extTools || []) {
      if (!tool || !tool.name) continue;
      const schema = tool.inputSchema || {};
      const required = Array.isArray(schema.required) ? schema.required.map(String) : [];
      if (required.length) this._index.set(tool.name, { required, properties: schema.properties || {} });
    }
  }

  _classify(name, params) {
    const entry = this._index.get(name);
    if (!entry || !entry.required.length) return { hard: [], soft: [] };
    const args = ToolRequiredArgs._asObject(params);
    const soft = new Set(ToolRequiredArgs.SOFT_REQUIRED[name] || []);
    const out = { hard: [], soft: [] };
    for (const key of entry.required) {
      if (ToolRequiredArgs._keysFor(name, key).some((k) => ToolRequiredArgs._present(args, k))) continue;
      (soft.has(key) ? out.soft : out.hard).push(key);
    }
    return ToolRequiredArgs._refuseEmptyCall(out, entry.required.length);
  }

  static _refuseEmptyCall(out, requiredCount) {
    if (out.hard.length || out.soft.length !== requiredCount) return out;
    return { hard: out.soft, soft: [] };
  }

  static _keysFor(name, key) {
    const perTool = ToolRequiredArgs.TOOL_ALIASES[name] || {};
    return [key, ...(perTool[key] || []), ...(ToolRequiredArgs.GLOBAL_ALIASES[key] || [])];
  }

  static _asObject(params) {
    return params && typeof params === 'object' && !Array.isArray(params) ? params : {};
  }

  static _present(args, key) {
    return Object.prototype.hasOwnProperty.call(args, key) && !ToolRequiredArgs._isAbsent(args[key]);
  }

  static _isAbsent(value) {
    if (value == null) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    return false;
  }

  static _receivedKeys(params) {
    return params && typeof params === 'object' ? Object.keys(params) : [];
  }

  static _fenceHint(name) {
    const fence = '```';
    return '\nIf you wrote the arguments and they still arrived empty, the native '
      + 'tool-call channel is dropping them. Do NOT retry the same way: write the call as a fenced '
      + `block in your reply text instead, exactly like this:\n${fence}tool\n`
      + `{"tool": "${name}", "params": { ...the arguments... }}\n${fence}`;
  }

  _softMissingNote(name, soft) {
    const properties = this._propertiesOf(name);
    const fields = soft.map((key) => {
      const described = ToolRequiredArgs._describe(properties, key);
      return described ? `"${key}" (${described})` : `"${key}"`;
    });
    return `Note: this ${name} call omitted ${fields.join(', ')}; a default was used. `
      + 'Check the result is what you intended and pass the field explicitly next time.';
  }

  _propertiesOf(name) {
    const entry = this._index.get(name);
    return (entry && entry.properties) || {};
  }

  static _describe(properties, key) {
    const prop = properties && properties[key];
    if (!prop) return '';
    if (typeof prop === 'string') return prop;
    const bits = [];
    if (prop.type) bits.push(prop.type);
    if (Array.isArray(prop.enum)) bits.push(`one of ${prop.enum.map((e) => JSON.stringify(e)).join(' | ')}`);
    if (prop.description) bits.push(String(prop.description).replace(/\s+/g, ' ').trim());
    return bits.join('; ');
  }
}

module.exports = ToolRequiredArgs;
