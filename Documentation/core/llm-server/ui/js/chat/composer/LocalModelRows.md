# LocalModelRows

`core/llm-server/ui/js/chat/composer/LocalModelRows.js`

The Local group of the model picker (the composer pill, the gear panel's model row and the chat landing's model name all open the same picker). Each local model is one compact row: name and summary (quant, architecture, native context, size, a muted "estimated" when no fit test ran) on the left; "In use" on the selected row, the model's chosen context as a small button ("64k"), and the Tune button on the right. Clicking the row picks the model at that context. The context button opens that one model's sizes in place under the row ([ContextOptionText](ContextOptionText.md) `compact`: size over a plain speed or state note, the full story in the tooltip) and closes any other model's, so the list stays readable and only the model in use is highlighted. Profiles sit under their model as single lines.

## Methods

- `new LocalModelRows(picker, ctx)`; `render(pop)`.
- `LocalModelRows.selectedRow(pop)`: the row of the model or profile in use (the picker scrolls it into view).

## Globals

None.
