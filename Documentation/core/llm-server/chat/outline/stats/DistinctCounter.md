# DistinctCounter

`core/llm-server/chat/outline/stats/DistinctCounter.js`

Counts distinct values up to a cap (`DEFAULT_CAP` = 100), in first-seen order.

## Methods

- `add(value)`, `count`, `isConstant`, `first()`.
- `label()`: `12 distinct`, or `100+ distinct` past the cap.
- `enumeration(observations)`: the values when there are at most `ENUM_MAX`
  (5) and they repeated (more observations than values), else null.

## Why

Distinct counts separate ids (all distinct) from categories (few, repeated);
the cap keeps memory bounded on a large sample.
