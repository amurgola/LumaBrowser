# FrameworkStore

`core/llm-server/ui/js/setup-ui/frameworks/FrameworkStore.js`

The last frameworks view main returned (`getFrameworksView`, [LlmFrameworks](../../../../ipc/LlmFrameworks.md), built by [FrameworksView](../../../../runtimes/FrameworksView.md)), with the lookups the Setup cards use. It lives on the context as `ctx.frameworks` ([SetupContext](../SetupContext.md)).

## Methods

- `view`: the last view (`{ frameworks, formats, current }`) or null.
- `setView(view)`: replaces it; every framework setter (`setActiveBuild`, `setFormatFramework`, `setModelFramework`, `setFrameworkOption`) returns the new view, which callers hand to this.
- `load(api)`: calls `api.getFrameworksView()`, stores the view on success, and resolves the view held afterwards. A missing method or a failed call keeps the last view.
- `get(frameworkId)`: the framework entry or null.
- `current()`: `{ modelPath, runtimeId, frameworkId, why }` of the default model, or null.
- `nameOf(frameworkId)`: its name, else the id.
- `buildName(runtimeId)`: the build's name from any framework, else the id.
- `format(formatId)`: the format entry (`frameworkIds`, `defaultFrameworkId`, `needsChoice`) or null.

## When it is refreshed

- [RuntimesCard](../runtimes/RuntimesCard.md)`.render()` loads it next to every runtimes view (so a [LibraryRefresher](../LibraryRefresher.md) pass with runtimes does too); a pass without runtimes calls `RuntimesCard.refreshFrameworks()`.
- [DefaultsCard](../defaults/DefaultsCard.md) calls `refreshFrameworks()` on every `defaults-changed` server event and after the user picks another model, since another framework may now serve the default model.
- The Frameworks card's own saves ([FrameworkControls](FrameworkControls.md)) and the Models card's pin saves replace the view with the one the setter returned.

## Why

The DOM contract of the framework refactor: the Models card and the Frameworks card read one copy of the view, so a choice made in either shows in both.
