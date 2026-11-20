# LoraModalMarkup

`core/llm-server/ui/js/image-setup/LoraModalMarkup.js`

Markup for the "LoRAs / speed" modal. No DOM access; [LoraModal](LoraModal.md) binds the events.

## Methods

- `LoraModalMarkup.html(label)` the modal: the curated slot (`.lora-curated`), the attached list (`.lora-attached`), the "Add a LoRA" picker (`#loraAdd`), the Import a file and Browse CivitAI buttons (`data-act="import-lora"`, `"browse-civitai"`), the speed preset checkbox (`#loraPreset`), the notes and the footer.
- `attachedHtml(rows)` one `.lora-item` per `{ title, weight, highNoise, note: { text, warn } }`: a `.lora-row` (`data-lora-index`, the row's handle) with the title, a "high noise" chip for a Wan high-noise entry, the weight input (`.lora-weight`) and Remove (`data-act="remove-lora"`), then the note. `NONE_ATTACHED` for an empty list.
- `addOptionsHtml(groups)` the picker's options from `[{ label, loras }]`: an `<optgroup>` per non-empty group, a flat list for a single unlabeled group, and "Nothing left to add" when every group is empty. An option reads `<label or name> · <size> · <base>`.

## Globals

None.
