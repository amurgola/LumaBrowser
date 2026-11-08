# DrafterDownloads

`core/llm-server/ui/js/setup-ui/models/DrafterDownloads.js`

The "Download drafter" action on an installed model's row: fetches the catalog
drafter beside the weights through the LLM download slot, paints its progress in the
row's download block from the model events, and repaints the library when it lands.

## Methods

- `new DrafterDownloads(ctx)` (the SetupContext: `api`, `refreshLibrary`);
  `attach(ctl)` the LLM list controller; `busy`.
- `onAction(row, act, btn)`: true for `drafter-download` and `drafter-cancel`
  (`DOWNLOAD`, `CANCEL`), false otherwise. The button carries `data-drafter-id` and
  `data-model-path` ([LlmModelRow.drafterOfferHtml](LlmModelRow.md)); the row key is
  the row's `mlKey`, else the button's `data-key`.
- `start(key, id, modelPath)`: the same download, started from the
  [DrafterModal](DrafterModal.md) catalog row.
- `DrafterDownloads.progressHtml(active)`: [AddonRow.progressHtml](AddonRow.md) plus
  a Cancel button.

## Flow

One download at a time (the main-side slot refuses a second anyway). The row's
`dlHtml` shows `Starting…`, then follows the shared `onModelEvent` stream: `start`
names the file, `download` carries bytes and rate, `verify` the digest check,
`resume` a continued partial. Cancel calls `cancelModelDownload` and paints
`Canceling…`. Success clears the strip and calls `ctx.refreshLibrary()`: the rescan
brings the row back with its `drafter` sidecar tag and without the offer. A stop
stays on the row as `Canceled: progress is saved, downloading again resumes.`, a
failure as `Failed: <error>`, with the button still there for another try.

## Globals

None.
