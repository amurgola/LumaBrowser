# LabIpcHandlers

`core/roleplay-lab/LabIpcHandlers.js`

IPC controller for the Roleplay Lab pane: routes `core.rpLab.*` to the
LabService the roleplay-mode extension publishes. Each handler is wrapped by
`IpcEnvelope.enveloped`, so a throw replies `{ success: false, error }`.

## Methods

- `new LabIpcHandlers(getLabService)`. `getLabService()` returns the LabService
  or `null`; it is called on every invoke. The app passes
  `() => global.__lumaRpLabService || null`.
- `register()` registers:
  - `core.rpLab.getScenario` -> `{ success, scenario: getScenario(), imageProfiles }`
    (`imageProfiles` is `{}` when the service has no `getImageProfiles`)
  - `core.rpLab.run(args)` -> `run(args || {})`
  - `core.rpLab.regenerateFrom(args)` -> `regenerateFrom(args || {})`
  - `core.rpLab.regenerateStep(args)` -> `regenerateStep(args || {})`
- When `getLabService()` returns null, every channel replies
  `LabIpcHandlers.NOT_REGISTERED`: `{ success: false, error: 'Roleplay mode is
  not registered (is the roleplay extension enabled?).' }`.
- `LabIpcHandlers.EVENT_CHANNEL` (`core.rpLab.event`).

Before each of the three streaming calls, `labService.broadcast` is pointed at
the invoking renderer: `broadcast(type, payload)` sends `{ type, payload }` on
`core.rpLab.event` (via SenderStream, skipped once that renderer is gone).

## Why a provider

LabService moved into `extensions/roleplay-mode/lab` and is published as
`global.__lumaRpLabService` when that extension activates. The controller is
registered at boot, before any extension activates, and the extension can be
disabled or re-enabled at runtime, so the service is looked up per call
instead of captured once.
