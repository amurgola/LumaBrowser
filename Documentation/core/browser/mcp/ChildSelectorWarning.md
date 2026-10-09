# ChildSelectorWarning

`core/browser/mcp/ChildSelectorWarning.js`

Words the structural defects extractData reported for a set of child selectors.

## Methods

- `ChildSelectorWarning.compose(result, childSelectors)` returns one string joined with `; `, or `null`:
  - each `duplicateFieldGroups` group: `<a, b> resolve to the same element in every row; treat them as one field`;
  - `nullFields`: `<fields> matched nothing in any row; the childSelector is likely wrong`, plus the
    `:nth-of-type` explanation when a failing field's selector is `.class:nth-of-type(n)`;
  - each `constantFields` entry: `<field> returns the same value ("<v>") in every row; the selector likely
    points at a static label, not the row's data`.
- `ChildSelectorWarning.NTH_CLASS_MISUSE`: the pattern for the class plus `:nth-of-type` trap.
