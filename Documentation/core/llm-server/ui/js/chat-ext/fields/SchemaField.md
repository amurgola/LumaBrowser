# SchemaField

`core/llm-server/ui/js/chat-ext/fields/SchemaField.js`

Base class for one schema field type. Contract (tested for every class in
`SchemaFieldRenderer.FIELD_CLASSES`): a static `types` array that no other
class claims, and `render(wrap, spec)`. `spec` is
`{ field, model, api, siblingModel, rootModel, renderer }`; a field writes into
`spec.model[spec.field.key]`. `labelled` (default `true`) says whether the
renderer adds the label row and hint.

## Methods

- `static get types()`, `get labelled()`, `render(wrap, spec)`: unimplemented members throw.
