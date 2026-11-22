# ModelFrames

`core/llm-server/ui/js/setup-ui/models/ModelFrames.js`

Splits the installed models into the frames the Models card lists them in, by each model's `servedBy` (set main-side by [ModelServing](../../../../runtimes/ModelServing.md)).

## Methods

- `ModelFrames.split(models, frameworks)` -> `[{ key, kind, frameworkId, runtimeId, formats, models }]`, no empty frame. `frameworks` is the renderer's FrameworkStore (`ctx.frameworks`) or null.
- Kinds (`SERVED`, `MISSING`, `UNLOADABLE`, `COMPANION`):
  - `served` (key `served:<frameworkId>`): `servedBy.installed`, a build of that framework runs the model now.
  - `missing` (key `missing:<frameworkId>`): ids set but `installed` false; `runtimeId` is the build to install (the first model's).
  - `unloadable` (key `unloadable`): `frameworkId` null with a `format`; `formats` lists the formats in it.
  - `companion` (key `companion`): `format` null, a projector or MTP head listed on its own (`mmproj-only`, `mtp-only`). A model with no `servedBy` lands here too.
- Order: frameworks in `frameworks.view.frameworks` order, ones the view lacks (or every one, before the view has loaded) after, in the order they first appear in the scan; a framework's `served` frame before its `missing` one; then `unloadable`, then `companion`.

## Why

The rule that picks a framework for a model lives main-side (ModelRuntimeResolver), so the list only reads the answer. Companions keep a frame of their own rather than being dropped, because the scan has always listed them and their rows carry the pairing notes.
