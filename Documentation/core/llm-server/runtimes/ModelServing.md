# ModelServing

`core/llm-server/runtimes/ModelServing.js`

Says, for each scanned model, which framework and build would run it.

## Methods

- `ModelServing.attach(models, { chooser, selection, context })` sets `servedBy` on every model and returns the
  list. `chooser`: a [RuntimeChooser](../service/RuntimeChooser.md). `selection`: a
  [FrameworkSelection](../service/FrameworkSelection.md). `context`: `{ runtimesView, diagnostics }`.
- `ModelServing.of(model, ...)` returns one `servedBy`:
  `{ format, frameworkId, runtimeId, why, installed, pinnedFrameworkId }`.
  - `installed: true`: that runtime runs it now.
  - `installed: false` with ids: nothing installed runs it; `runtimeId` is the build to install.
  - ids null: nothing on this host loads it; `format` null for a projector or a draft head.

## Why

The model lists group models under the framework that runs them and offer a pin where two frameworks load a
format. Doing that in the renderer would be a second copy of the resolver's rule.
