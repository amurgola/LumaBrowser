# EmbeddedScriptCheck

`core/llm-server/validation/validators/EmbeddedScriptCheck.js`

Compiles the JavaScript a file carries as a string for another context to run,
which ESLint never parses. Run by [JavaScriptValidator](JavaScriptValidator.md)
on files that parse.

## Methods

- `EmbeddedScriptCheck.check(ast)` takes an ESTree `Program` with `loc` and
  returns diagnostics `{ line, column: 1, severity: 'error', message, ruleId:
  'embedded-script', source: 'embedded-script' }`, one per broken script.

A template literal is checked when it is an argument of a call to one of
`RUNNER_NAMES` (`executeJs`, `executeJavaScript`, `executeScript`, `evaluate`,
`evaluateHandle`, as a method or a bare function), or when its text opens like
an IIFE (`SCRIPT_START`: an optional `;` or `!`, then `(function`, `(async`,
`(() =>` or `(x =>`) and is at least `MIN_CHARS` (40) long. Its cooked text
(escapes applied; the raw text for a quasi with an invalid escape) is compiled
as a classic script with `espree`, each `${...}` stood in by `PLACEHOLDER`
(`0`). The diagnostic's line is the host file line of the broken script line;
the message names the template's line, the parser error and its line inside the
script, and the fix.

## Why

The Code agent shipped an extension whose page script, a template literal,
joined its CSS with `.join('\n')`: inside a template literal `\n` becomes a real
newline, so the injected code had an unterminated string. `main.js` linted
clean, every `executeJs` rejected, and the extension's `.catch(() => {})` hid
it, so the extension installed "clean" and did nothing. Catching it at write
time turns that into an error the agent fixes before installing.
