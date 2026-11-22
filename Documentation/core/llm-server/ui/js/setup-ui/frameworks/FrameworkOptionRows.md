# FrameworkOptionRows

`core/llm-server/ui/js/setup-ui/frameworks/FrameworkOptionRows.js`

The rows of one framework's Options fold in the Frameworks card: only the options its active build declares (`framework.options`, see the Options contract of [FrameworksView](../../../../runtimes/FrameworksView.md)).

## Methods

- `FrameworkOptionRows.html(framework, context)`: segmented rows first, then the switches in a `.defaults-opt-grid`; '' when nothing is drawn. `context`: `{ rows, prefs, npuNames, servesDefault }`.
- `FrameworkOptionRows.shown(framework, context)`: the options that get a control: custom ones of kind `toggle` or `choice`, known ones listed in `KNOWN`, and `pinModelRam` only when `prefs.ramPinSupported()`.
- `FrameworkOptionRows.controlId(frameworkId, optionId)`: `fw-<framework>-<option>`.
- `FrameworkOptionRows.isOn(value)`, `isKvFull(value)`.
- `KNOWN`: label, caption and help key (into [DefaultsCardHtml](../defaults/DefaultsCardHtml.md)`.HELP`, where all help copy lives) of `kvCacheType` (segmented Full/Half), `maxConcurrent` (the parallel ladder), `openvinoDevice` (the [DefaultsOptions](../defaults/DefaultsOptions.md) device set naming a detected NPU), and the switches `tensorSplit`, `noMoeGpuCache` (shown inverted as "MoE GPU cache"), `cacheReuse` ("Context retention"), `usePeerGpus`, `pinModelRam`.

## Controls and values

Every control (checkbox, or the hidden input of a segmented picker, through the `controlAttrs` of [DefaultsRows](../defaults/DefaultsRows.md)) carries `data-fw-option="<frameworkId>:<optionId>"` and `data-fw-value`, which tells [FrameworkControls](FrameworkControls.md) how to read it (`VALUE`): `bool`, `not` (inverted switch), `number`, `text`, `optional` ('' sends null). Only the OpenVINO device's Auto sends null: null removes the framework's own value, so any other control always sends an explicit value. Full KV precision is the position `f16` (`KV_FULL`); a stored null, '' or `f16` reads as Full.

Custom options: `toggle` is a switch, `choice` a segmented picker over `custom.choices`, with `custom.label`, `custom.caption` and `custom.help` (all escaped); `note.text` joins the caption, and `note.tone === 'warn'` gives it the warning colour (`.fw-option-note.is-warn`). A choice's caption sits on a line under its row (`.fw-option-caption`).

## Live captions

The RAM pin and Peer GPUs captions keep their fixed span ids (`#ramPinHint`, `#peerGpusHint`, filled by [RamPinHint](../defaults/RamPinHint.md) and [PeerGpusHint](../defaults/PeerGpusHint.md)) and are drawn only when `servesDefault`, in the frame of the framework that serves the default model: both describe the default model, and one id per page stays unique even when two frameworks declare the option.

## Why

"Only show the options that are actually selectable for that instance type": the active build decides, and the copy is shared with what the Chat defaults card used to show.
