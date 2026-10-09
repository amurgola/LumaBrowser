# ValueProfile

`core/llm-server/chat/outline/ValueProfile.js`

Everything observed at one JSON path, merged across every value seen there (one
value for a plain field, many for `$.rows[*].id`).

## Methods

- `record(value, kind)`: counts the kind, feeds the matching stats
  ([NumberStats](stats/NumberStats.md), [StringStats](stats/StringStats.md),
  [BooleanStats](stats/BooleanStats.md)) and array lengths; keeps the first value.
- `countOf(kind)`, `seen`, `firstValue`, `kinds`, `stats`, `arrayLengths`.
- `field(key)`: the child profile for a key (created on first use), or null
  once `MAX_FIELDS` (100) are tracked; later keys are only counted.
- `elementProfile()`: the `[*]` child profile.
- `fieldCount`, `unprofiledFieldCount`.

## Why

A field's presence (`seen`) against its parent's object count is what marks it
optional. The field cap stops keyed maps (ids as keys) from creating thousands
of profiles.
