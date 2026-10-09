# RepeaterField

`core/llm-server/ui/js/chat-ext/fields/RepeaterField.js`

`type: 'repeater'`: an array of sub-field groups under `key` with
"+ Add <itemLabel>" and per-item Remove; optional AI add through
`assistAdd({ api, items, rootModel, setStatus })` returning an item or `null`.

## Methods

- `render(wrap, spec)`.
