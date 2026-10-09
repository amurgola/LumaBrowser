# extension

`ide/vscode/extension.js`

The entry VS Code loads (`package.json` "main"): exports `activate(context)` and `deactivate()` (the shape VS Code
requires), loads the CLI connect library through [CliConnectLib](src/CliConnectLib.md) (null when `lib/` was not
built) and hands the work to [LumaExtension](src/LumaExtension.md).

## Methods

- `activate(context)`, `deactivate()`.
