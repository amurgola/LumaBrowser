# AsarLayoutVerifier

`tools/build/verify/AsarLayoutVerifier.js`

Checks a packed app.asar against the project it was built from:

- distributable extensions ([ExtensionManifests](../shared/ExtensionManifests.md))
  are not in the archive,
- `mcp-server.js` and its whole require closure
  ([RequireScanner](../shared/RequireScanner.md) over a
  [SourceTree](../shared/SourceTree.md) of the archive listing) are in
  `app.asar.unpacked`, and `core/shell/McpServer.js` loads under a stock Node
  from there,
- every native `.node` file (and koffi) is in `app.asar.unpacked`.

Run it with `npm run verify:asar -- --asar <path>` or
`node scripts/verify-asar.js --asar <path>`; CI does this on every leg with the
matrix `asar_path`.

## Methods

- `new AsarLayoutVerifier({ asarPath, sourceRoot, asar, nodePath, log })`.
- `verify()`: `{ pass, fail }`, logging one `[OK]` or `[FAIL]` line per check.
