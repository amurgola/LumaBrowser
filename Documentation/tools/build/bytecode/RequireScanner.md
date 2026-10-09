# RequireScanner

`tools/build/bytecode/RequireScanner.js`

Finds relative `require()` targets (literal `./` or `../` specifiers, including
lazy ones inside functions) and resolves them the way Node does (exact, `.js`,
`/index.js`). Package requires are ignored.

## Methods

- `RequireScanner.specifiers(source)`, `resolve(tree, fromRel, spec)`,
  `requiredFiles(tree, rel)`, `closure(tree, roots)` (roots included).
