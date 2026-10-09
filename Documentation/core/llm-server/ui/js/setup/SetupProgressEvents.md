# SetupProgressEvents

`core/llm-server/ui/js/setup/SetupProgressEvents.js`

Turns runtime-install and model-download events into progress-bar updates with
the same wording on every setup leg.

## Methods

- `SetupProgressEvents.runtimeListener(hooks, { companionPrefix?, installPhase? })`
  handles `download` events with a total (`'1.0 GB / 2.0 GB'`, prefixed
  "Companion · " for companion downloads when `companionPrefix`) and `extract`
  events ("Extracting…", or with `installPhase` "Installing…" plus the pip line
  from `payload.label` as a sub-line).
- `SetupProgressEvents.modelListener(hooks, extra?)` handles `download` (fraction
  plus [TransferText](../format/TransferText.md) sub-line and the payload) and
  `verify` ("Verifying the download…"; seconds on an NVMe, but silence at 100%
  reads as a hang). `extra(e)` handles leg-specific types first and returns
  `true` when it did.
- Constants: `VERIFYING`, `EXTRACTING`, `INSTALLING`.

## Globals

None.
