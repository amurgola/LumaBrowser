# ValueStats

`core/llm-server/chat/outline/stats/ValueStats.js`

Base for per-kind statistics at one path.

## Methods

- `observe(value)`: counts, then calls the subclass's `_observe`.
- `describe()` (abstract): the phrase for this kind.
- `detail()`: an optional tail, empty by default.
- `_constant(kind, valueText)`: `integer 1`, or `integer 1 (always)` when seen
  more than once; shared by every subclass.

Subclasses: [NumberStats](NumberStats.md), [StringStats](StringStats.md),
[BooleanStats](BooleanStats.md).
