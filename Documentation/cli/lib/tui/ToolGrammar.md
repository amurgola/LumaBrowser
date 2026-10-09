# ToolGrammar

`cli/lib/tui/ToolGrammar.js`

The vocabulary every LumaBrowser client uses for a tool step: the verb, progressive form and glyph per
tool, the one-line detail from its params, the status copy, and the token formatter. Shared by the
terminal and the IDE webviews (JetBrains and VS Code copy this file in at build time), so a
`read_file` row reads the same everywhere.

## Methods (static)

- `toolStyle(name)`: `{ verb, ing, glyph, mutating? }`; an unknown tool falls back to its own name
  (`mcp__x__y` -> `calling mcp  x  y`).
- `toolDetail(name, params)` (alias `summarizeParams`): `npm test`, `src/a.js :10-29`,
  `/foo/ in src (*.js)`, `a.js · 2 edits`, `a.js · 3 lines`, `"query"`, `agent · "message"`; other tools
  show `path`, `url`, `query`, `pattern`, or up to three scalar `key=value` pairs.
- `pendingText({ tool, target, chars })`: what the model is doing while a call streams out
  (`writing src/a.js · 1.2k chars`).
- `longWaitText(kind, secs)`: after `LONG_WAIT_AFTER` (20 s) a `thinking` or `working` wait cycles
  through canned thoughts (`LONG_WAIT`), one per `LONG_WAIT_EVERY` (10 s), chosen from the elapsed
  time alone; `null` before that.
- `statusText({ phase, attempt?, inFlight? })`: `STATUS_TEXT` copy, else the phase with spaces, else `working`.
- `trimSummary(name, params, summary)`: the tool's summary minus the subject the title already shows.
- `short(text, n = 60)`, `fmtTokens(n)` (`999`, `1.2k`, `33k`, `2.5M`), `toolPath(name, params)`.
- Constants: `TOOL_STYLE`, `FILE_TOOLS`, `MUTATING_FILE_TOOLS`, `STATUS_TEXT`, `LONG_WAIT`,
  `LONG_WAIT_AFTER`, `LONG_WAIT_EVERY`.

## Exception to the module rule

This file is also loaded as a classic browser script, so the class lives inside an IIFE that sets
`module.exports = ToolGrammar` under CommonJS and `window.LumaToolGrammar = ToolGrammar` in a browser,
leaking no other global. Statics never use `this`, so webviews may destructure them. A test runs it in
a bare VM context to keep it that way.
