const BrowserTools = require('../../../llm-service/BrowserTools');
const FunctionSchema = require('./FunctionSchema');

class BrowserToolSchemas {
  static TAB_ID_HINT = 'Use -1 (the active working tab). ';

  static build(allows) {
    return BrowserTools.TOOL_DEFINITIONS
      .filter((tool) => allows(tool.name))
      .map((tool) => FunctionSchema.build(
        tool.name,
        tool.description,
        BrowserToolSchemas._properties(tool.params),
        Array.isArray(tool.required) ? tool.required : [],
      ));
  }

  static paramToSchema(typeStr) {
    const type = BrowserToolSchemas._jsonType(String(typeStr || '').toLowerCase());
    const schema = { type, description: String(typeStr) };
    if (type === 'array') schema.items = { type: 'object' };
    return schema;
  }

  static _properties(params) {
    const props = {};
    for (const [name, typeStr] of Object.entries(params || {})) {
      props[name] = BrowserToolSchemas.paramToSchema(typeStr);
      if (name === 'tabId') props[name].description = BrowserToolSchemas.TAB_ID_HINT + props[name].description;
    }
    return props;
  }

  static _jsonType(lower) {
    for (const type of ['number', 'boolean', 'array', 'object']) {
      if (lower.startsWith(type)) return type;
    }
    return 'string';
  }
}

module.exports = BrowserToolSchemas;
