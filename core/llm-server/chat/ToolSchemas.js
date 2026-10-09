const BrowserToolSchemas = require('./tool-schemas/BrowserToolSchemas');
const PseudoToolSchemaTable = require('./tool-schemas/PseudoToolSchemaTable');
const FunctionSchema = require('./tool-schemas/FunctionSchema');
const LazySchemaStubber = require('./tool-schemas/LazySchemaStubber');
const FenceFallbackDoc = require('./tool-schemas/FenceFallbackDoc');
const ScheduleBounds = require('./tool-groups/ScheduleBounds');

class ToolSchemas {
  static MIN_EVERY_MINUTES = ScheduleBounds.MIN_EVERY_MINUTES;
  static MAX_EVERY_MINUTES = ScheduleBounds.MAX_EVERY_MINUTES;

  static buildHarmonyTools({ allows, extTools, activeGroups = null, groups = null }) {
    const full = [
      ...ToolSchemas.browserToolSchemas(allows),
      ...ToolSchemas.pseudoToolSchemas(allows),
      ...ToolSchemas.extToolSchemas(extTools),
      ToolSchemas.activateToolSchema(),
    ];
    return LazySchemaStubber.apply(full, groups, activeGroups);
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

  static extToolSchemas(extTools) {
    return (extTools || []).map((tool) => FunctionSchema.build(
      tool.name,
      tool.description || tool.name,
      (tool.inputSchema && tool.inputSchema.properties) || {},
      (tool.inputSchema && tool.inputSchema.required) || [],
    ));
  }

  static stubToolSchema(name, group) {
    return LazySchemaStubber.stubSchema(name, group);
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
