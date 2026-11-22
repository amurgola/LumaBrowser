# ToolCallNormalizer

`core/llm-service/tools/ToolCallNormalizer.js`

Normalizes one parsed ```` ```tool ```` fence body to `{ tool, params }`.

## Methods

- `ToolCallNormalizer.normalize(value)` returns `null` for a non-object or
  when no tool name can be found, else:
  - `{"tool","params"}`: passed through, no marker;
  - `{"name","arguments"}` or `{"name","params"}`: `__coerced: 'aliased-keys'`;
  - `{"tool"|"name","args"}` with an object under `args` and no other key
    beside it: `args` is the arguments, `__coerced: 'aliased-keys'`. With any
    other argument beside it, or with a string under it, `args` is one of the
    tool's own parameters (`test_tool` and `desktop_launch` have one) and the
    call is read as flattened;
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

`args` is the key Inkling 2 uses in its own call format
(`{"name": ..., "args": {...}}`). On 2026-11-22, on the native route through
Basalt, it wrote two `update_plan` calls as text fences with that key. They
were read as flattened, so the tool received `{ "args": { "done": 4 } }`,
refused both, and the reply ended with the plan still on its first step.
