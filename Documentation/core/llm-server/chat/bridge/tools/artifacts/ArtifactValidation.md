# ArtifactValidation

`core/llm-server/chat/bridge/tools/artifacts/ArtifactValidation.js`

The validation gate on artifacts the agent writes. Never throws.

## Methods (all static)

- `codeNote(artifact)`: for a `code` artifact, the `CodeValidator.formatForModel`
  block (plus a fix-it line when not ok), or `''`.
- `liveNote(js)`: the same for a live module's JS, linted as `module.js`.
- `liveFatalError(js)`: a message when the module would not run at all (a
  `let`/`const`/`var` of `root`, `R` or `Chart`, or a syntax error, up to 5
  lines), else null. Checked before persisting.
- `redeclaredInjectedName(code)`: the redeclared injected name or null.
- `INJECTED_NAMES`, `REDECLARED`, `MAX_SYNTAX_LINES`.
