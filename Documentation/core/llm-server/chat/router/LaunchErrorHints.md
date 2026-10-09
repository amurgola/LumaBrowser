# LaunchErrorHints

`core/llm-server/chat/router/LaunchErrorHints.js`

Carries the server launcher's machine-readable failure fields (`code`, `runtimeId`, `runtimeName`, `installable`) between launcher results, thrown errors and chat events.

## Methods

All static.

- `of(err)`: the hint fields present on an error (truthy `code`, `runtimeId`, `runtimeName`; boolean `installable`), `{}` for none.
- `failureFrom(err)`: a thrown start as `{ success: false, error, code, runtimeId, runtimeName, installable }`.
- `errorFrom(result)`: an Error with the result's message (default `START_FAILED`, "Failed to start the local server.") and its hint fields.

## Why

The chat UI turns these into a fix (an uninstalled runtime becomes a Download button that retries the turn), so they must survive every hop from the launcher to the error event.
