# ShellTier

`core/shell/shellClassifier/ShellTier.js`

The four shell safety tiers on a ladder from mildest to harshest, and how verdicts combine.

## Methods

- `ShellTier.READONLY`, `NORMAL`, `MASS_DESTRUCTIVE`, `FORBIDDEN`: the tier values `'readonly'`, `'normal'`,
  `'mass-destructive'`, `'forbidden'`. Frozen: the approval gate and UI compare these strings.
- `ShellTier.TIERS`: the ladder, mildest first. A tier's severity is its index; nothing else encodes the order.
- `ShellTier.isKnown(tier)`: one of the four values.
- `ShellTier.severity(tier)`: position on the ladder; an unknown value sits level with `normal`.
- `ShellTier.compare(a, b)`: sort comparator (negative when `a` is milder).
- `ShellTier.harshest(...tiers)`: the most severe; ties keep the earliest, so an accumulator stays put.
- `ShellTier.worst(a, b)`: two-tier `harshest`, the name ShellClassifier folds verdicts with.
- `ShellTier.isWorse(tier, than)` (strict), `ShellTier.isAtLeast(tier, floor)` (inclusive).
- `ShellTier.sortWorstFirst(verdicts)`: a stably sorted copy of `{ tier }` objects, harshest first.

## Why

Severity is derived from one ordered list instead of a separate rank table, so adding or reordering a tier cannot
leave two encodings disagreeing. Unknown values rank as `normal` so a typo still asks the user but can never
outrank or hide a real `forbidden`.
