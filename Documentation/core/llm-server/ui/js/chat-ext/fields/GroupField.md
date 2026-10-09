# GroupField

`core/llm-server/ui/js/chat-ext/fields/GroupField.js`

`type: 'group'`: sub-fields stored as one nested object under `key`; the
wrapper becomes `.cm-xgroup` with a title (label row and hint dropped).

## Methods

- `render(wrap, spec)` recurses through `spec.renderer`.
