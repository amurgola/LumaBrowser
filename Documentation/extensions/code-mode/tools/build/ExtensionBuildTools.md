# ExtensionBuildTools

`extensions/code-mode/tools/build/ExtensionBuildTools.js`

The extension-builder tool set for one turn.

## Methods (static)

- `create({ context, conversationId, meta, sessions })` -> the plain tools of
  `TOOL_CLASSES` ([WriteExtensionFileTool](WriteExtensionFileTool.md),
  [ReadExtensionFileTool](ReadExtensionFileTool.md),
  [ListExtensionFilesTool](ListExtensionFilesTool.md),
  [InstallExtensionTool](InstallExtensionTool.md),
  [DiscardBuildTool](DiscardBuildTool.md)) over one [BuildWorkspace](BuildWorkspace.md).
