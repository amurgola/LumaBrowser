# ImageField

`core/llm-server/ui/js/chat-ext/fields/ImageField.js`

`type: 'image'`: stored as `{ b64, mime }`. Upload, or Generate (unless
`generate: false`) from `genFromKey` on the sibling model or a quick prompt,
composed as `promptPrefix, <rootModel[styleFromKey]>, subject` with
`modelFromKey`, `width`/`height` (512) and `steps` (24). A failure shows under
the field.

## Methods

- `render(wrap, spec)`.
