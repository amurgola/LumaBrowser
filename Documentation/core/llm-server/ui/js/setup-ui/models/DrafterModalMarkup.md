# DrafterModalMarkup

`core/llm-server/ui/js/setup-ui/models/DrafterModalMarkup.js`

Markup for [DrafterModal](DrafterModal.md), drawn with the image LoRA modal's classes
([LoraModalMarkup](../../image-setup/LoraModalMarkup.md)) so both dialogs read as one
control.

## Methods

- `html({ label, offer, options })`: the dialog: intro, the catalog slot, the
  `#drafterSel` picker, notes, and the Cancel and Save footer.
- `curatedHtml(offer)`: the catalog drafter row (`In library` when installed,
  `Needs llama.cpp` when no runtime can run it, else a `data-act="dl-drafter"`
  Download button); empty without an offer.
- `options(model, library)`: `Automatic: <autoText>`, `Built-in MTP head (no drafter
  file)` when the weights carry one, `None: no speculative decoding`, then every library
  drafter; the current choice is selected. Values are `AUTO`, `MTP`, `OFF` or the file path.
- `autoText(model)`: the folder's drafter, else `built-in MTP head`, else `none in this folder`.
- `fileText(d)`: `name · size · block N · folder`, with `folderText` naming a file in
  the root `models folder` (its relative folder is `''` or `.`).

## Globals

None.
