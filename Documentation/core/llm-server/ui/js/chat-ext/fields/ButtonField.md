# ButtonField

`core/llm-server/ui/js/chat-ext/fields/ButtonField.js`

`type: 'button'`: a generic action. `field.onClick({ api, model, rootModel, setStatus })`
runs with the button disabled; a throw shows its message in `.cm-xbtn-status`.
The hint (if any) goes above the button; no label row.

## Methods

- `render(wrap, spec)`.
