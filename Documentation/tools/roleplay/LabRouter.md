# LabRouter

`tools/roleplay/LabRouter.js`

Builds the app's chat router for the Roleplay Lab outside the app: the real
`UnifiedChatRouter` over an in-memory `ChatStore` carrying the chat tables
the settings database declares, a mode registry holding the roleplay mode,
and a `ModelDispatcher` whose local path is the router's own (`LocalStream`,
`LocalRequest`, the runtime catalog's chat adapter) pointed at a server that
is already up. Tests pass a dispatcher double instead.

## Methods

- `LabRouter.build({ service, mode, dispatcher, db })` -> `{ router, registry, chatStore, close() }`.
  `service` is a [LabServerService](LabServerService.md) (or any
  `llmServerService` double); `mode` a descriptor to register under the
  extension id `roleplay-mode` (null: register later on `registry`);
  `dispatcher` anything with `dispatch(...)` (default `localDispatcher`);
  `db` a settings double (default `settingsDb()`). The router publishes itself
  on `global.__lumaChatRouter` as in the app, which is how the mode's
  conversation path finds the store; `close()` restores the previous global
  and closes the store's database.
- `LabRouter.chatStore()` the in-memory store over `ChatTablesSchema.SQL`
  and its post-migration index.
- `LabRouter.localDispatcher({ service, db })`, `settingsDb(initial)`,
  `bridgeStub()` (the agent bridge is never used: the roleplay mode runs the
  plain path), `core(rel)`.

## Why

The Lab must run the code the app runs. Building the real router instead of
re-shaping requests means a change in the router (a new style document, a
thinking-dial rule) reaches the Lab the day it lands.

## Changes (2026-11-09, helper model)

`localDispatcher` adds the app's `HelperStream` over `service.helperModel` (a [LabHelperModel](LabHelperModel.md)) when the service has one, so `helper::` refs route as in the app.
