# AsarBytecodeVerifier

`tools/build/verify/AsarBytecodeVerifier.js`

Checks a packed app.asar after the bytecode step:

- every shipped `.js` outside node_modules is a stub with its `.jsc` exactly when
  [SourceClassifier](../bytecode/SourceClassifier.md) says so, judged from the
  source tree restricted to the archive's own listing (what afterPack saw),
- the pinned `REGRESSION_ROWS` (past incidents and every ChangeRequests "Build"
  file; `absent` for distributable extensions),
- distributable extensions are not in the archive,
- `mcp-server.js` and its whole require closure are plain in `app.asar.unpacked`,
  and `core/shell/McpServer.js` loads under a stock Node from there,
- every native `.node` file (and koffi) is in `app.asar.unpacked`.

Run it with `npm run verify:bytecode` (rehearsal) or
`node scripts/_verify-bytecode-asar.js --asar <path>` (a real build; CI does this
on every leg).

## Methods

- `new AsarBytecodeVerifier({ asarPath, sourceRoot, asar, nodePath, log, rows })`.
- `verify()`: `{ pass, fail }`.
