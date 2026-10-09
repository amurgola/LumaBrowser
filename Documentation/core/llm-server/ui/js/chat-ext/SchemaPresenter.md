# SchemaPresenter

`core/llm-server/ui/js/chat-ext/SchemaPresenter.js`

Presents a [SchemaCard](SchemaCard.md) as an overlay modal or inline in a host.

## Methods

- `openModal(schema, opts)`: `.luma-modal-overlay` on `<body>`, card width
  `min(680px,92vw)`; a backdrop click cancels.
- `openInline(schema, opts)`: the card (class `luma-modal--inline`) appended to
  `opts.host`; without a host, the modal. Both resolve the model or `null` and
  remove what they mounted.
