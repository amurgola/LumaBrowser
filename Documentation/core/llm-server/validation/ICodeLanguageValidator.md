# ICodeLanguageValidator

`core/llm-server/validation/ICodeLanguageValidator.js`

Base class (interface) for per-language code validators used by the CodeValidator
dispatcher.

## Members

- `get name()` short engine label, surfaced as `Diagnostic.source` (for example
  `eslint`, `typescript`, `json`, `powershell`). Throws until implemented.
- `get languages()` canonical language keys this validator handles; the
  dispatcher registers it under each one. Throws until implemented.
- `validate(code, context)` returns `Diagnostic[]` or a Promise of it. `context`
  is `{ language, filename? }`, where `language` is the canonical key the
  dispatcher resolved, so a validator covering several variants (`typescript`
  vs `tsx`) can branch without re-parsing the original tag. Throws until
  implemented.
- `ICodeLanguageValidator.SEVERITIES` is `['error', 'warning', 'info']`.

A `Diagnostic` is `{ line, column, endLine?, endColumn?, severity, message,
ruleId?, source }`. Lines and columns are 1-based to match Monaco's marker API
and human "L12:5" references. `source` equals the validator's `name`.

## Why an interface

Each validator is a self-contained strategy (ESLint for JS, the TypeScript
compiler for TS, a WASM parser for PowerShell) but they all return the same
controlled shape, so the chat `validate_code` tool, the artifact auto-gate and the
editor markers stay language-agnostic. Adding a language means implementing this
class and registering it in CodeValidator.
