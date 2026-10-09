# VscodeExtensionBuilder

`tools/ide/VscodeExtensionBuilder.js`

Builds `ide/vscode` into `ide/dist/luma-vscode.vsix`: syncs `media/` (the page, bundled app.js, tool grammar,
icon) and `lib/` (the closure of `cli/lib/connect/AppDiscovery.js` and `BridgeConnector.js`), stages the shipped
files with the app's version and `LICENSE.txt`, zips the VSIX and writes `vscode.json`. Thin entry:
`scripts/build-vscode-extension.js` (`npm run build:vscode`).

## Methods

- `new VscodeExtensionBuilder(root, { log, error })`; `execute(args)` (resolves the exit code; `--force`, `--skip`),
  `syncGenerated()`, `connectPairs()`.
- Constants: `CLI_LIB_DIR`, `CONNECT_ENTRIES`, `SHIP`.
