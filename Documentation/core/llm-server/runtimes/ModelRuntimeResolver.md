# ModelRuntimeResolver

`core/llm-server/runtimes/ModelRuntimeResolver.js`

Decides which runtime serves a model.

## Methods

- `ModelRuntimeResolver.resolve({ model, rows, selection, legacyRuntimeId, order, usable })`:
  - `model`: a scanned model. `rows`: the runtimes view's rows in catalog order. `selection`: a
    [FrameworkSelection](../service/FrameworkSelection.md). `legacyRuntimeId`: what the old single "selected
    runtime" setting holds. `order`: runtime ids in host preference order. `usable(row)`: whether a row can serve
    now (default `isInstalled`).
  - Returns one of:
    - `{ runtime, frameworkId, why }`: a usable row serves the model;
    - `{ missing, frameworkId }`: rows could load it but none is usable; `missing` is the row to install;
    - `{ unloadable: format }`: nothing on this host loads it (format null for a companion file).
- The rule:
  1. The rows that load the model's format ([RuntimeFrameworks](RuntimeFrameworks.md)) and that the model does
     not rule out (`ModelRuntimeMatch.refusal`: an add-on model names its runtimes).
  2. Among the usable ones, the framework: the only one (`why: 'only'`), else the model's pin (`pin`), a
     framework whose row the model prefers (`claim`: `model.preferredRuntimes`, ik_llama's own quantizations or
     an add-on sidecar), the format's default framework (`format-default`), the framework of the old setting
     (`previous`), the first in catalog order (`first`). A choice of a framework with no usable row is passed over.
  3. The build within it: the stored active build, the old setting, the model's own preference, the host order,
     the first.
  4. With no usable row the same rule runs over every loader to name the one to install.
- `isInstalled(row)`: installed with a binary path.
- `pickBuild(builds, wantedIds)`: the first wanted id that is a build, else the first build, else null.
- `WHY`: the six reasons.

## Why

One rule in one place: the launch, the context estimate in the model picker, the fit test and the Setup tab all
ask here, so they cannot disagree about what will run. The old setting stays in the rule as a fallback so an
install that predates frameworks behaves the same until the user makes a choice.
