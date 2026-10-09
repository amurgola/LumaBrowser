# TextInputField

`core/llm-server/ui/js/chat-ext/fields/TextInputField.js`

`type: 'text' | 'number'`. Numbers honour `min`/`max`/`step` and store a
number, or `null` when emptied. `browse: 'directory'` adds a Browse button that
fills the input from `api.pickDirectory` (or `window.llmDiagAPI.pickDirectory`).

## Methods

- `render(wrap, spec)`.
