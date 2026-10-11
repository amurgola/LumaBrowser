# RequireScanner

`tools/build/shared/RequireScanner.js`

Finds relative `require()` targets (literal `./` or `../` specifiers, including
lazy ones inside functions) and resolves them the way Node does (exact, `.js`,
`/index.js`). Package requires are ignored.
[AsarLayoutVerifier](../verify/AsarLayoutVerifier.md) uses `closure` to find
every file the stand-alone MCP server loads.

## Methods

- `RequireScanner.specifiers(source)`, `resolve(tree, fromRel, spec)`,
  `requiredFiles(tree, rel)`, `closure(tree, roots)` (roots included).
