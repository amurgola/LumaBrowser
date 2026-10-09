# LumaCommands

`ide/vscode/src/LumaCommands.js`

Registers every `luma.*` command package.json declares.

## Methods

- `new LumaCommands({ session, view, editorContext })`; `handlers()` (id to handler), `register(context)`.
- `LumaCommands.EXTENSION_ID` (`lumabyte.luma-vscode`, matches VscodeExtensionInstaller), `MAX_ATTACHED_FILES` (12, warning only).
