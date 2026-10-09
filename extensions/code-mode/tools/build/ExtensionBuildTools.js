const BuildWorkspace = require('./BuildWorkspace');
const WriteExtensionFileTool = require('./WriteExtensionFileTool');
const ReadExtensionFileTool = require('./ReadExtensionFileTool');
const ListExtensionFilesTool = require('./ListExtensionFilesTool');
const InstallExtensionTool = require('./InstallExtensionTool');
const DiscardBuildTool = require('./DiscardBuildTool');

class ExtensionBuildTools {
  static TOOL_CLASSES = [
    WriteExtensionFileTool, ReadExtensionFileTool, ListExtensionFilesTool, InstallExtensionTool, DiscardBuildTool,
  ];

  static create({ context, conversationId, meta, sessions }) {
    const workspace = new BuildWorkspace({ code: context && context.code, sessions, conversationId, meta });
    return ExtensionBuildTools.TOOL_CLASSES.map((ToolClass) => new ToolClass(workspace).toTool());
  }
}

module.exports = ExtensionBuildTools;
