# FormFiller

`core/browser/tab-manager/FormFiller.js`

fill_form: several fields in one page call.

## Methods

- `FormFiller.fill(page, { fields })` -> `{ success, data: { results: [{ field, success, error? }] } }`.
  Each field is found by `ref`, `selector` or `label` text (label `for`, nested, or the next form control).
- `FormFiller.script(fields)`.

## Why

Values go through the native prototype setter with bubbling `input` and `change` events so React and Vue controlled inputs see the change; selects match by value or option text.
