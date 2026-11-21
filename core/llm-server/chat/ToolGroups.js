const StaticGroupTable = require('./tool-groups/StaticGroupTable');
const ExtensionGroupBuilder = require('./tool-groups/ExtensionGroupBuilder');
const ActivationManual = require('./tool-groups/ActivationManual');
const FenceExampleStripper = require('./tool-groups/FenceExampleStripper');
const GeneratedPayload = require('./tool-groups/GeneratedPayload');

class ToolGroups {
  static ACTIVATE_TOOL_DOC = ActivationManual.ACTIVATE;
  static PAYLOAD_TOOLS = GeneratedPayload.PAYLOAD_TOOLS;

  static staticGroups() {
    return StaticGroupTable.GROUPS.map((group) => ({ ...group, tools: [...group.tools] }));
  }

  static extGroupsFor(extTools) {
    return ExtensionGroupBuilder.groupsFor(extTools);
  }

  static extToolDoc(tool) {
    return ExtensionGroupBuilder.toolDoc(tool);
  }

  static groupForTool(name, groups) {
    if (!name) return null;
    const owner = (groups || []).find((group) => group.tools && group.tools.includes(name));
    return owner ? owner.key : null;
  }

  static buildInactiveRegistry(inactiveGroups, { nativeTools = false } = {}) {
    if (!inactiveGroups || inactiveGroups.length === 0) return '';
    const lines = inactiveGroups.map((group) => `  - ${group.key}: ${group.stub}`).join('\n');
    const manual = nativeTools ? ActivationManual.ACTIVATE_NATIVE : ActivationManual.ACTIVATE;
    const directive = nativeTools ? ActivationManual.INACTIVE_DIRECTIVE_NATIVE : ActivationManual.INACTIVE_DIRECTIVE;
    return `${manual}\n\n${ActivationManual.INACTIVE_HEADING}\n${lines}\n\n${directive}`;
  }

  static docWithoutFenceExamples(doc) {
    return FenceExampleStripper.strip(doc);
  }

  static carriesGeneratedPayload(toolName, params) {
    return GeneratedPayload.carries(toolName, params);
  }
}

module.exports = ToolGroups;
