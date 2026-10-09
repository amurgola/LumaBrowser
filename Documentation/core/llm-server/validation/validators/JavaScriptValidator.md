# JavaScriptValidator

`core/llm-server/validation/validators/JavaScriptValidator.js`

ESLint-backed validator for JavaScript and JSX. Extends
[ICodeLanguageValidator](../ICodeLanguageValidator.md).

## Members

- `name` is `'eslint'`; `languages` is `['javascript', 'jsx']`.
- `validate(code, { language })` returns `Diagnostic[]` synchronously. JSX
  parsing is on only when `language` is `'jsx'`.
- `JavaScriptValidator.GLOBALS` is the ambient globals table (console, process,
  require, window, fetch, timers and so on).
- `JavaScriptValidator.RULE_OVERRIDES` is applied on top of the `@eslint/js`
  recommended rules: `no-undef` off, `no-dupe-keys` and `no-dupe-args` errors,
  `no-unused-vars`, `no-empty`, `no-constant-condition`, `no-unreachable` and
  `no-cond-assign` warnings.

ESLint severity 2 and fatal parse errors become `'error'`, everything else
`'warning'`. A fatal message with no rule gets `ruleId: 'syntax'`. If the
Linter itself throws, one error diagnostic reads `ESLint could not parse the
source: <message>`.

## Why

The linter runs in-process with the flat-config `Linter` (no config files, no
disk I/O), and `eslint` is required lazily so it costs nothing until the first
JavaScript validation.

`no-undef` is off because snippets reference host globals that cannot be
enumerated; the globals list only keeps `no-unused-vars` quiet on common names.

Script versus module is ambiguous for a bare snippet, so the code is linted as
a module first and, only if that produced fatal errors, again as CommonJS; the
run with fewer fatal errors wins. A CommonJS script with a top-level `return`
is therefore not reported as a broken module.
