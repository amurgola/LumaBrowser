# StartupModelAlert

`ui/shell/notifications/StartupModelAlert.js`

Shortly after the window starts, asks main which saved model choices can no
longer be used (the [Preflight](../../../core/llm-server/Preflight.md) issues
marked `selection`: a default chat, helper, image, editor, video or music model
that is gone, or an extension slot bound to a model nothing offers any more) and
puts each in the [NotificationLog](NotificationLog.md) with a "Choose a model"
button that takes the user to the control where that choice is made, by the
search palette's reveal (`core.palette.reveal`: the page opens, any fold around
the control opens, and the control is highlighted).

## Methods

- `new StartupModelAlert({ log, reveal, ipc })`: `log` is the NotificationLog,
  `reveal` the [SettingsReveal](../settings/SettingsReveal.md), `ipc` is `window.ipcBridge`.
- `install()`: runs `check()` after `DELAY_MS` (5 s, long enough for the
  extensions to register their slots); does nothing without `ipc.invoke`.
- `check()`: invokes `core.llmServer.getPreflight`, keeps the issues with
  `selection: true` and adds each title as an `error` entry with the button.
  Resolves the issues it alerted on; a failed read alerts on nothing (the LLM
  tab's own banner still lists them).
- `open(issue)` (async): when the fix names `settingId`, invokes
  `core.palette.reveal` with `(settingId, selector)`; when it names none, or the
  reveal does not answer `success`, falls back to `openPage(fix)`.
- `openPage(fix)`: an `open-view` fix invokes `core.llmServer.openSetup` with
  `{ page: fix.view }`; an `open-settings` fix reveals the extension's page
  (`{ surface: 'extension', extensionId }`) or the Settings tab
  (`{ surface: 'shell', tab }`, default `aiproviders`).
- Statics: `DELAY_MS`, `PREFLIGHT_CHANNEL`, `OPEN_SETUP_CHANNEL`, `REVEAL_CHANNEL`,
  `ACTION_LABEL`.

Installed by [ShellApp](../app/ShellApp.md).

## Globals

None directly; `ipc` is passed in.
