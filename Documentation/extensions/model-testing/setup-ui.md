# setup-ui.js, setup-ui.css (model-testing)

`extensions/model-testing/setup-ui.js`, `extensions/model-testing/setup-ui.css`

The Setup area's "Model testing" tab, registered with
`window.LumaSetupExt.registerTab({ id: 'model-testing', label: 'Model testing', mount, onShow })`
(logs "[model-testing] LumaSetupExt not present" without the host).
Classic-script exception: the extension is `distributable: true`, so this stays one self-contained classic file (add-on scripts are injected as classic scripts).

## Behaviour

- No title of its own: the Setup page already titles the tab, so the head is one line
  saying what the tab is for.
- Model picker: every downloaded chat model from `state.models`, named
  `<display name> · <file stem>` (the display name leaves the quantization out, and two
  files of one model differ only by it), the default marked `(default)` and selected
  first. A run in flight decides the selection.
- Tests: one tick box per suite (all ticked at first) with its description, task count,
  duration and the picked model's latest score, or "not run yet".
- Run tests: sends `run { modelPath, suiteIds }`. Disabled with a reason while a fit test
  runs or no test is ticked. A note says a model other than the default is loaded for the
  run and the default is put back afterwards.
- While a run is in flight the pickers are locked and the row shows Cancel, a progress
  bar and where the run is (`loading the model`, `warming up`, or `done/total · group · task`),
  from `status` polled every second. Only that row repaints on a poll.
- When the run ends the state is read again: a refusal or failure shows in an error line,
  and each test with a stored result for the picked model shows its report (overall score,
  band, worst decile, a row per capability group, coverage and when it ran).
- Download raw results: offered for the most recent run of this session only
  (`state.raw`), saved as `<suiteId>-<ranAt>.json`.
- Coming back to the tab (`onShow`) re-reads the state, so models downloaded and tests run
  meanwhile show.

Every action goes through `api.invoke(action, payload)`
([ModelTestingActions](ModelTestingActions.md)); a report's group labels come from the
report itself, so the page mirrors no main-process table.

## Globals

Reads `window.LumaSetupExt`. Injects
`<link id="mt-css" href="/llm-ui/ext/model-testing/setup-ui.css">`, which is on tokens.css
per the [design system](../../ui/DesignSystem.md): shared `.luma-*` primitives, one primary
button, and a status colour only for a score below "usable".
