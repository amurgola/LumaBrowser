# RuntimeChooser

`core/llm-server/service/RuntimeChooser.js`

The service's one answer to "which runtime runs this model".

## Methods

- `new RuntimeChooser({ selection, catalog, legacyRuntimeId, hostOrder })`: `legacyRuntimeId()` returns the stored
  default runtime id; `hostOrder(diagnostics, runtimesView)` returns runtime ids in this host's order.
- `forModel(model, { runtimesView, diagnostics, usable })`: the
  [ModelRuntimeResolver](../runtimes/ModelRuntimeResolver.md) outcome for a scanned model, fed with the stored
  choices, the old setting and `buildOrder`.
- `buildOrder(diagnostics, runtimesView)`: `PREFERRED_BUILDS` (`llama-cpp-luma`) followed by the host order.
- `activate(runtimeId)`: makes a runtime the active build of its framework; false for a runtime the catalog does
  not know.

## Why

Callers hold a service, not the three inputs the resolver needs, and every one of them must pass the same
inputs. The LumaByte llama.cpp build leads where the user has stored no choice, as it already does for the
helper model and the tool router. `activate` is what a written `runtimeId` means now: wizards and the fit
test's "Use" still send one.
