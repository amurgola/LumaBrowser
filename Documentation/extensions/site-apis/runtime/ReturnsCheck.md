# ReturnsCheck

`extensions/site-apis/runtime/ReturnsCheck.js`

Checks a run's final result against the endpoint's `returns` shape.

## Methods

- `ReturnsCheck.check(returns, result)` -> null when the result fits, else the `shape_mismatch` fault
  (`detail: { expected, actual, missingFields? }`):
  - `rows`: a list whose every item is an object, and every declared `fields` entry present as a key on at
    least one row (an empty list passes);
  - `object`: a plain object;
  - `value`: a scalar (string, number, boolean or null);
  - `text`: a string.
  A missing `returns` means `text`.
