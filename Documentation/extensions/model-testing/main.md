# model-testing (manifest.js, main.js)

`extensions/model-testing/manifest.js`, `extensions/model-testing/main.js`

The Model Testing add-on: tests what a downloaded LLM model can do. The user picks a
downloaded model and the tests to run from a "Model testing" tab in LLM Setup (Developer
group). `distributable`: it is not in the app by default and ships as its own zip
(`npm run build:extensions` writes `dist/extensions/model-testing.zip`). A dev checkout
loads it from `extensions/` like every other extension.

The first test suite is the LumaBrowser compatibility gambit, which lived in core
(`core/llm-server/gambit`, the Defaults card's "Compatibility gambit" fold and the
`core.llmServer.*Gambit*` IPC channels) until 2026-11-18.

## Entry

- `manifest.js`: id `model-testing`, no declared dependencies (only the always-provided
  `setupTab` surface is used), `main: './main.js'` and
  `setupTab { id, label: 'Model testing', group: 'developer', file: './setup-ui.js', assets: ['./setup-ui.css'] }`.
  The bundle and its asset stay at the extension root because the loader whitelist and
  URL stamping use the basename.
- `main.js` holds one [ModelTestingExtension](ModelTestingExtension.md) and exports
  `{ activate(context), deactivate(), _internals: { handleInvoke } }`.

## Flow

1. Activation registers the Setup handler with `context.setupTab.onInvoke`.
2. The tab ([setup-ui](setup-ui.md)) reads `state`, starts a `run` with a model path and
   suite ids, and polls `status` ([ModelTestingActions](ModelTestingActions.md)).
3. [TestSession](session/TestSession.md) resolves the model through
   [TestTarget](session/TestTarget.md), plays each picked suite from the
   [TestSuiteCatalog](TestSuiteCatalog.md) and restores the default model.
4. The `run-gambit` command ([GambitCli](../../tools/gambit/GambitCli.md)) calls the same
   actions from the command line.

## Adding a test suite

A suite is a class with `id`, `describe()`, `run()`, `results()` and `save()` (see
[TestSuiteCatalog](TestSuiteCatalog.md)); [CompatibilityGambit](gambit/CompatibilityGambit.md)
is the model. Add it to the list the catalog builds and it shows as one more tick box.

## Core modules used

Through [CoreRequire](CoreRequire.md): `llm-server/eval/*` (task loading and scoring, shared
with the prompt eval), `llm-server/service/ModelResultStore`,
`llm-server/server/ServerLauncher`, `llm-server/ipc/LlmDefaultsUpdater` and
`llm-server/LlmModelsScanner`. The chat router and the LLM service are read from
`global.__lumaChatRouter` when the tab first asks.
