# TypeScriptValidator

`core/llm-server/validation/validators/TypeScriptValidator.js`

TypeScript-compiler validator for TS and TSX. Extends
[ICodeLanguageValidator](../ICodeLanguageValidator.md).

## Members

- `name` is `'typescript'`; `languages` is `['typescript', 'tsx']`.
- `validate(code, { language })` builds a one-file program over the source
  (`artifact.ts` or `artifact.tsx`) and returns its syntactic and semantic
  diagnostics as `Diagnostic[]` with `ruleId: 'TS<code>'`. Compiler categories
  map to `'error'`, `'warning'` or `'info'`.
- `TypeScriptValidator.IGNORED_CODES` is the set of diagnostic codes dropped.

## Why

A standalone snippet has no `node_modules` and no external declarations, so
module resolution is off (`noResolve`, `types: []`) and the diagnostics that
only fire because of that are filtered: unresolved modules and names (2307,
2304 and relatives), missing JSX runtime (2874 to 2876), missing declaration
files (7016), implicit-any JSX elements (7026) and top-level await or
isolatedModules artifacts (1378, 1208). What remains is genuine type errors.

The source file is served from memory through a wrapped compiler host; only lib
files are read from disk. `typescript` is required lazily.
