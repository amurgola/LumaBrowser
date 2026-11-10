# ContextOptionText

`core/llm-server/ui/js/chat/composer/ContextOptionText.js`

Text for the model picker's context chips, keeping a measured fit apart from an
estimate and a measured speed apart from a predicted one ("~").

## Methods

- `ContextOptionText.ctxLabel(tokens)`: "16k", "128k".
- `ContextOptionText.chip(option, selected)`: `{ cls, text, tip }`.
- `ContextOptionText.compact(option, selected)`: `{ cls, label, note, tip }` for the picker's in-place size list ([LocalModelRows](LocalModelRows.md)): the size ("64k") over a plain note ("150 t/s", "partial · ~20 t/s", "CPU"); an estimate shows through the muted `est` class and the tooltip, not tildes in the text.
