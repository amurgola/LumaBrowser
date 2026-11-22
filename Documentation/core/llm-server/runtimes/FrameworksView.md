# FrameworksView

`core/llm-server/runtimes/FrameworksView.js`

The Setup tab's picture of the frameworks, built from the runtimes view and the stored choices.

## Methods

- `FrameworksView.build({ rows, selection, legacyRuntimeId, order, describeOptions, current })` returns
  `{ frameworks, formats, current }`, serializable:
  - `frameworks[]`: `{ id, name, formats, installed, activeBuildId, builds, options }`. `builds[]` is every build
    known on this host: `{ id, name, installed, usable, version, active }`. `activeBuildId` is the build a launch
    would use among the installed ones (the stored choice, the old setting, the host order, the first), null when
    none is installed. `options` comes from `describeOptions(framework, activeBuildRow)` and is empty for a
    framework that is not installed.
  - `formats[]`: one entry per format an installed framework loads: `{ id, frameworkIds, defaultFrameworkId,
    chosen, needsChoice, hub }`. `needsChoice` is true only where two or more installed frameworks load the format.
    `hub` is where the model search finds the format on the Hub (`{ tag, extension }` from
    [HubSources](HubSources.md)), null for GGUF and MLX, which the search knows by itself.
    `defaultFrameworkId` is the stored choice when it is one of them (`chosen: true`), else the old setting's
    framework, else the first.
  - `current`: passed through: what serves the default model.

## Why

The view carries the answer, not the inputs: the renderer draws the active build and the format default it is
given and never works the rule out itself, which is what kept the old Setup lists and the launcher from agreeing.
A choice is only surfaced where it is real, so a one-framework install shows nothing to choose.
