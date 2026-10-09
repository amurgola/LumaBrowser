# ContextOptionText

`core/llm-server/ui/js/chat/composer/ContextOptionText.js`

Text for the model picker's context chips, keeping a measured fit apart from an
estimate and a measured speed apart from a predicted one ("~").

## Methods

- `ContextOptionText.ctxLabel(tokens)`: "16k", "128k".
- `ContextOptionText.chip(option, selected)`: `{ cls, text, tip }`.
