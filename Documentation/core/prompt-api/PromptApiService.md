# PromptApiService

`core/prompt-api/PromptApiService.js`

"Local model for web pages": lets web pages use the user's local model through
the web Prompt API (`LanguageModel.create()`, `prompt()`). Electron 45 routes
that API to a utility process the app supplies (`session.registerLocalAIHandler`,
experimental). This service forks that process
([prompt-api-worker](worker/prompt-api-worker.md)), hands it to every tab
session, and answers the worker's requests: the worker keeps each page's
conversation and sends every prompt here, where the chat router's default model
answers it. Off by default (setting `core.promptApi.enabled`), because a page
that may prompt the model uses the user's GPU; once on, each site still needs
the user's answer ([PromptApiAccess](PromptApiAccess.md)).

## Methods

- `new PromptApiService({ db, getRouter, access, fork?, log? })`: `getRouter()` returns the
  chat router (`ExtensionGlobals.chatRouter()`) or null, read per request because
  the router is built after this service; `access` a
  [PromptApiAccess](PromptApiAccess.md) (FoundationServices passes
  `new PromptApiAccess()`); `fork` defaults to Electron's
  `utilityProcess.fork`, resolved lazily.
- `enabled()` the `core.promptApi.enabled` setting (`ENABLED_KEY`), false unless
  set to true.
- `status()` `{ enabled, running }` for the Settings switch (`running`: the worker
  is up).
- `setEnabled(enabled)` saves the setting, `apply()`, returns `status()`.
- `attachSession(sess)` remembers a tab session (at boot and as partitions are
  created, from [SessionSetup](../../app/ready/SessionSetup.md)) and, when on,
  registers the worker on it. A session without `registerLocalAIHandler` (an
  older Electron) is ignored; each session is taken once.
- `apply()` brings every known session in line with the setting: on starts the
  worker (once) and registers it on each; off registers `null` on each (open
  Prompt API sessions in pages end) and kills the worker.
- `dispose()` as off, and forgets the sessions.

## Requests from the worker

Messages `{ type: 'request', id, method, params }`, answered with
`{ type: 'reply', id, result }` or `{ type: 'reply', id, error }`:

- `availability` `{ origin }` -> `'available'` when there is a chat router with
  `complete` and the user has not blocked the site, else `'unavailable'`. A
  blocked site is told there is no model, so it never learns it was refused and
  never prompts.
- `access` `{ webContentsId, origin }` (sent when a page creates a session) ->
  `true` when `access.allowed(...)` resolves true; that may show the permission
  prompt in the page's tab. Otherwise rejects with `REFUSED`
  (`This site is not allowed to use the local model`).
- `prompt` `{ webContentsId, origin, messages: [{ role, content }] }` -> checks
  access again (a remembered answer resolves at once, an Allow once lasts until
  the tab leaves the site), then the answer text:
  `router.complete({ messages, timeoutMs: 120000, noThink: true })`, with any
  `<think>...</think>` block removed and trimmed
  ([ThinkingText](../shared/text/ThinkingText.md)). Logs the page origin and the
  message count. A refused site, no router, or no text in the result rejects.
- anything else rejects (`Unknown Prompt API request`).

A worker that exits on its own is released (pages are told the model is
unavailable) until the setting is switched again or the app restarts.

## Limits

- Text only: a picture or audio part is refused by
  [PromptConversation](worker/PromptConversation.md).
- No streaming: a streamed prompt arrives as one chunk.
- `responseConstraint` is ignored.
- The context window a page sees is a nominal 8192 tokens, not the loaded
  model's real one.
- Once on, each site asks first, like camera access: the first session a site
  creates prompts in its tab (Allow once / Always allow / Block), and the answer
  is remembered per site by [PermissionManager](../browser/PermissionManager.md)
  (kind `localModel`). The app's own file:// pages are allowed without a prompt.
