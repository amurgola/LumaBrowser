# CodeValidator

`core/llm-server/validation/CodeValidator.js`

The in-process code validation dispatcher. It resolves a language tag or
filename to one registered [ICodeLanguageValidator](ICodeLanguageValidator.md),
runs it, and returns one result shape. Callers (the chat `validate_code` tool,
the create_artifact auto-gate, CodeWorkspace, Monaco markers, Tool Forge) stay
language-agnostic; surfacing the result is their job.

## Methods (all static)

- `validate({ language?, filename?, content })` resolves
  `{ ok, supported, language, engine?, diagnostics, errors, warnings, summary, error? }`.
  `ok` means no error-severity diagnostic. Diagnostics are sorted by line then
  column. An unsupported language (`supported: false`) and a crashing validator
  (`error` set) both return `ok: true`: validation must never block the model.
- `formatForModel(result, { max = 25 })` renders the compact block the model
  reads (see [ValidationResult](ValidationResult.md)).
- `normalize(language, filename)` returns the canonical key or `null`. The tag
  wins over the filename; anything with a dot is reduced to its extension, then
  mapped through `ALIASES`.
- `isSupported(language, filename)`, `supportedLanguages()` (sorted keys).
- `register(validator)` registers under every key in `validator.languages`;
  later registrations win, so an extension can override a built-in. Throws when
  the argument has no `validate()`.
- `ALIASES`: `js/mjs/cjs/node -> javascript`, `jsx`, `ts -> typescript`, `tsx`,
  `json`, `jsonc/json5 -> jsonc`, `ps1/psm1/psd1/pwsh/posh -> powershell`.

Built-ins registered at load: JavaScriptValidator (eslint), TypeScriptValidator,
JsonValidator and PowerShellValidator (syntax-only, sandboxed WASM, never runs on
the host). Heavy engines load lazily inside their validators, so requiring this
costs nothing at startup.

The registry is static, as in legacy, so the class can be passed where a
`{ validate }` object is expected (Tool Forge's `validator`).

## Adding a language

Implement ICodeLanguageValidator, drop it in `validators/`, register it in
`_registerBuiltIns` (or call `register` at runtime) and add its aliases.
