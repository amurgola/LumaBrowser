# PowerShellSyntaxCollector

`core/llm-server/validation/validators/PowerShellSyntaxCollector.js`

Turns the ERROR and MISSING nodes of a tree-sitter PowerShell parse tree into
diagnostics.

## Methods

- `PowerShellSyntaxCollector.collect(rootNode, source)` returns `Diagnostic[]`
  with `source` as their `source` field:
  - an ERROR node gives `Syntax error near "<first 40 chars>"`, `ruleId:
    'ps-syntax'`, with start and end positions; its children are not visited;
  - a MISSING node gives `Missing '<type>'`, `ruleId: 'ps-missing'`;
  - at most `MAX_DIAGNOSTICS` (25) are reported;
  - when nothing locatable was found, one `ps-syntax` error at 1:1 reads
    `PowerShell parse error (could not fully parse the script).`
- Only call it for a tree whose root reports `hasError`.

## Why

tree-sitter is error-recovering, so errors are nodes in the tree rather than
exceptions. The top-most ERROR is the useful report; its children are just the
partial parse and would flood the output. Error recovery can also flag a tree
without an ERROR or MISSING node to point at, and code the grammar could not
parse must never pass silently, hence the fallback.
