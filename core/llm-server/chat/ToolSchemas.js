const BrowserToolSchemas = require('./tool-schemas/BrowserToolSchemas');
const PseudoToolSchemaTable = require('./tool-schemas/PseudoToolSchemaTable');
const FunctionSchema = require('./tool-schemas/FunctionSchema');
const FenceFallbackDoc = require('./tool-schemas/FenceFallbackDoc');
const ScheduleBounds = require('./tool-groups/ScheduleBounds');

class ToolSchemas {
  static MIN_EVERY_MINUTES = ScheduleBounds.MIN_EVERY_MINUTES;
  static MAX_EVERY_MINUTES = ScheduleBounds.MAX_EVERY_MINUTES;

  static buildHarmonyTools({ allows, extTools }) {
    return [
      ...ToolSchemas.browserToolSchemas(allows),
      ...ToolSchemas.pseudoToolSchemas(allows),
      ...ToolSchemas.extToolSchemas(extTools),
      ToolSchemas.activateToolSchema(),
    ];
  }

  static browserToolSchemas(allows) {
    return BrowserToolSchemas.build(allows);
  }

  static pseudoToolSchemas(allows) {
    return PseudoToolSchemaTable.ENTRIES
      .filter((entry) => allows(entry.name))
      .map(ToolSchemas._fromEntry);
  }

  static activateToolSchema() {
    return ToolSchemas._fromEntry(PseudoToolSchemaTable.ACTIVATE_TOOLS);
  }

  static callToolSchema() {
    return ToolSchemas._fromEntry(PseudoToolSchemaTable.CALL_TOOL);
  }

  static extToolSchemas(extTools) {
    return (extTools || []).map((tool) => FunctionSchema.build(
      tool.name,
      tool.description || tool.name,
      (tool.inputSchema && tool.inputSchema.properties) || {},
      (tool.inputSchema && tool.inputSchema.required) || [],
    ));
  }

  static fenceFallbackDoc(names, schemas = null) {
    return FenceFallbackDoc.build(names, schemas || ToolSchemas.pseudoToolSchemas(() => true));
  }

  static paramToSchema(typeStr) {
    return BrowserToolSchemas.paramToSchema(typeStr);
  }

  static _fromEntry(entry) {
    return FunctionSchema.build(entry.name, entry.description, entry.properties, entry.required);
  }
}

module.exports = ToolSchemas;
