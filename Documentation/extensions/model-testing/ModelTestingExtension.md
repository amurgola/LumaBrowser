# ModelTestingExtension

`extensions/model-testing/ModelTestingExtension.js`

The active Model Testing add-on.

## Methods

- `activate(context)` registers the Setup handler with `context.setupTab.onInvoke` and resolves `{}`.
- `handleInvoke(action, payload)` delegates to [ModelTestingActions](ModelTestingActions.md),
  built on first use from `global.__lumaChatRouter` and its `llmServerService`: a
  [TestSuiteCatalog](TestSuiteCatalog.md), a [TestSession](session/TestSession.md) and a
  [TestModels](TestModels.md). Throws `The LLM server is not ready yet. Reopen this tab in a moment.`
  while the router does not exist.
- `deactivate()` asks a run in flight to stop (it restores the default model itself as it
  winds down) and drops the session and the actions.

## Why

The chat router is parked on `global` at boot, which may be after this add-on activated,
so nothing is built until the tab asks.
