# InstallExtensionTool

`extensions/code-mode/tools/build/InstallExtensionTool.js`

`install_extension {}` (a [CodeTool](../CodeTool.md); name-gated by the
approval gate's `MUTATING_TOOLS`).

## Behaviour

- Before any write: `Nothing to install: write manifest.js and main.js first.`
- Emits status `installing`, calls `context.code.installAndActivate`, then
  `installed` (recording `installedId`) or `error`.
- Success: `{ success: true, extensionId, message: 'Installed and activated "<name>" (id: <id>). ...' }`.
- Failure: `{ success: false, error, message }` with the manifest problems as
  `- ` lines and "Fix the files and call install_extension again."
