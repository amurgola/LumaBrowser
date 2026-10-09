# ToolCallNormalizer

`core/llm-service/tools/ToolCallNormalizer.js`

Normalizes one parsed ```` ```tool ```` fence body to `{ tool, params }`.

## Methods

- `ToolCallNormalizer.normalize(value)` returns `null` for a non-object or
  when no tool name can be found, else:
  - `{"tool","params"}`: passed through, no marker;
  - `{"name","arguments"}` or `{"name","params"}`: `__coerced: 'aliased-keys'`;
  - anything else: every other key becomes `params`,
    `__coerced: 'flattened-params'` (a stray non-object `params`/`arguments`
    is dropped).
  - The bridge markers `__argsLost` (string), `__argsCut`, `__repaired` (true)
    are carried onto the call and never leak into `params`.

## Why

Inside a tool fence the context is unambiguous, so the shapes local models
drift into are accepted rather than half-read. Before this, a flattened call
kept its name but lost every argument (grep ran with no pattern). Dropping the
markers would let a call whose arguments were lost or cut run as complete.
