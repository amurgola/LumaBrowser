# SchemaCard

`core/llm-server/ui/js/chat-ext/SchemaCard.js`

The schema form card shared by the modal and inline presentations: head,
fields with `showIf` visibility, required-field validation and the foot.

## Methods

- `new SchemaCard(renderer?)`; `build(schema, opts, close)` returns the
  `.luma-modal.cm-schema` card. `opts.api` defaults to `window.llmDiagAPI`;
  `opts.initial` is deep-copied into the model. Submit with missing required
  fields shows "Please fill in: <labels>"; otherwise `close(model)`. Cancel is
  `close(null)`.
- `SchemaCard.isVisible(field, model)`: `showIf { key, equals }`, `{ key, in: [] }`
  or a bare `{ key }` (truthy). Visibility refreshes on every input and change.
- `SchemaCard.missingFields(schema, model)`: required, visible, and `null` or `''`.

## Globals

Reads `window.llmDiagAPI` (default api).
