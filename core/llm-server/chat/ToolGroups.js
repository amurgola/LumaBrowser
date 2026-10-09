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

  static buildInactiveRegistry(inactiveGroups) {
    if (!inactiveGroups || inactiveGroups.length === 0) return '';
    const lines = inactiveGroups.map((group) => `  - ${group.key}: ${group.stub}`).join('\n');
    return `${ActivationManual.ACTIVATE}\n\n${ActivationManual.INACTIVE_HEADING}\n${lines}\n\n${ActivationManual.INACTIVE_DIRECTIVE}`;
  }

  static docWithoutFenceExamples(doc) {
    return FenceExampleStripper.strip(doc);
  }

  static carriesGeneratedPayload(toolName, params) {
    return GeneratedPayload.carries(toolName, params);
  }
}

module.exports = ToolGroups;
