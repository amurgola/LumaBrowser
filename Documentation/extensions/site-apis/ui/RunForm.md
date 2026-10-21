# RunForm

`extensions/site-apis/ui/RunForm.js`

The inline Run form under an endpoint row.

## Methods

- `new RunForm({ site, endpoint, invoke, onRan })`; `render()` builds one labelled input per declared param
  (`number` inputs for numbers, a checkbox for booleans, the default as the value, the example or description as
  the placeholder, `*` after a required name) and a Run button.
- `values()`: the inputs keyed by name; blanks are left out so the endpoint's defaults apply, numbers are coerced.
- `submit()`: `invoke('run', site.id, endpoint.name, values())`, then `showResult` and `onRan(result)` (the row's
  reload, so the last-run line updates).
- `showResult(result)`: success renders `JSON.stringify(data, null, 2)` in a `.luma-code` block (capped at 20000
  characters); a fault renders `StatusText.fault(fault, advice)` in a `.luma-error` block.
