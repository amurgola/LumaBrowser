# PowerShellValidator

`core/llm-server/validation/validators/PowerShellValidator.js`

Syntax-only PowerShell validator. Extends
[ICodeLanguageValidator](../ICodeLanguageValidator.md).

## Members

- `name` is `'powershell'`; `languages` is `['powershell']`.
- `async validate(code)` returns `[]` for blank input, for input larger than
  `MAX_BYTES`, and for scripts that parse cleanly; otherwise the diagnostics from
  [PowerShellSyntaxCollector](PowerShellSyntaxCollector.md).
- `PowerShellValidator.MAX_BYTES` is 2 MB.

## Why

PowerShell cannot be linted by running PowerShell on untrusted code:
PSScriptAnalyzer fetches `using module` dependencies from the Gallery and the
parser resolves `using assembly` at parse time. Instead the script is parsed by
the tree-sitter grammar inside WebAssembly ([PowerShellGrammar](PowerShellGrammar.md)),
which has no host bindings, so the worst a hostile script can do is produce a
bad parse tree.

The trade-off is that only syntax is checked (unbalanced braces, unterminated
strings, malformed parameters); there are no style or security rules.

Oversized input is skipped rather than failed to cap worst-case work. The parse
tree and parser are freed in a `finally`, since web-tree-sitter manages wasm
memory by hand.
